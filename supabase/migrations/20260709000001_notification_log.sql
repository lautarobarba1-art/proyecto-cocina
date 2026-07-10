-- Registro de notificaciones transaccionales (WhatsApp / email de respaldo)
-- Reverse-engineered a mano para esta fase (no ejecutado aún contra el proyecto real).
-- Verificar contra el schema real de Supabase antes de aplicar.
-- Requiere: 20260519000001_classes.sql, 20260519000002_reservations.sql (public.set_updated_at()
-- ya existe desde la primera; se reutiliza acá, no se redefine).
--
-- ⚠️ LIMITACIÓN DOCUMENTADA (no resuelta por este diseño, y no lo pretende):
-- si el proveedor (WhatsApp Cloud API / Resend) ACEPTA el mensaje pero el proceso
-- se cae antes de que `complete_notification_attempt` persista la respuesta, la
-- fila queda en 'processing' y eventualmente se puede reclamar de nuevo (ver más
-- abajo) y reintentar el envío. Esto puede producir un mensaje duplicado del lado
-- del cliente final. Este esquema da idempotencia "best effort" del lado nuestro
-- (nunca se reclama dos veces en paralelo, nunca se sobreescribe un resultado ya
-- persistido), pero NO es una garantía de "exactly once" end-to-end — el tramo
-- entre "el proveedor confirmó recepción" y "nosotros lo persistimos" es una
-- ventana real de ambigüedad que este diseño no puede cerrar sin soporte de
-- idempotencia del lado del proveedor (WhatsApp no expone eso hoy).

-- ─── Tabla notification_log ────────────────────────────────────────────────────
-- Una fila = un evento de negocio (channel + delivery_mode + deduplication_key)
-- con su historial de intentos. La deduplicación es por
-- (channel, delivery_mode, deduplication_key) — ver lib/notifications/idempotency.ts
-- para cómo se arma la deduplication_key por evento (a propósito permite, por
-- ejemplo, más de una reprogramación notificada para la misma reserva).
--
-- delivery_mode separa el namespace de idempotencia de un envío real ('live')
-- del de una simulación ('dry_run'). Es deliberado: sin esta separación, una
-- notificación corrida en dry-run (o con el canal deshabilitado) quedaría
-- registrada como 'skipped' bajo la MISMA deduplication_key que usaría un envío
-- real más adelante — y como 'skipped' no es un estado reclamable, un envío
-- real futuro para ese mismo evento quedaría bloqueado para siempre. Con
-- delivery_mode como parte de la clave única, un intento en 'dry_run' y un
-- intento 'live' para el mismo evento son filas distintas que no se pisan.
-- Convención para quien llame a claim_notification_attempt: pasar
-- delivery_mode='live' únicamente cuando se está por intentar un envío real
-- (feature habilitada y NO en modo simulado); 'dry_run' para cualquier otro
-- caso (feature deshabilitada, modo simulado, o cualquier ejecución que no
-- vaya a pegarle de verdad al proveedor).

create table if not exists public.notification_log (
  id                      uuid primary key default gen_random_uuid(),

  -- Qué evento es, por qué canal, y si fue un envío real o uno simulado.
  channel                 text not null
                            check (channel in ('whatsapp', 'email')),
  delivery_mode           text not null default 'live'
                            check (delivery_mode in ('live', 'dry_run')),
  event_type              text not null
                            check (event_type in (
                              'reserva_confirmada',
                              'pago_confirmado',
                              'recordatorio',
                              'cancelacion',
                              'reprogramacion'
                            )),

  -- Clave determinista de deduplicación (ver lib/notifications/idempotency.ts).
  deduplication_key       text not null,

  -- Contexto. reservation_id en SET NULL (no CASCADE): si se borra una reserva
  -- (borrado admin de una reserva mal hecha, ver app/api/admin/reservations/[id]
  -- acción "delete"), el historial de notificaciones se conserva para auditoría,
  -- solo se pierde el vínculo directo a la fila borrada.
  reservation_id          uuid references public.reservations(id) on delete set null,
  class_id                uuid references public.classes(id) on delete set null,
  recipient               text not null,

  -- Qué se envió (o se intentó enviar). El payload es la reproducción MÍNIMA y
  -- SANITIZADA de las variables usadas en la plantilla/email — nunca tokens,
  -- headers, secretos ni la respuesta completa del proveedor. Ver
  -- lib/notifications/payload.ts (sanitizeNotificationPayload), que se aplica
  -- antes de que cualquier payload llegue a esta tabla.
  template_name           text,
  payload                 jsonb not null default '{}'::jsonb,

  -- Ciclo de vida del intento.
  -- 'skipped' cubre tanto "feature deshabilitada" como "dry run": un envío
  -- simulado NUNCA debe quedar registrado como 'sent'. El motivo puntual
  -- (disabled / dry_run / invalid_phone / template_not_configured / etc.) va
  -- en error_code.
  status                  text not null default 'processing'
                            check (status in ('processing', 'sent', 'delivered', 'read', 'failed', 'skipped')),
  provider_message_id     text,

  -- Lease de claim: cada reclamo (nuevo o reintento) genera un claim_token
  -- nuevo. complete_notification_attempt exige que el token coincida Y que el
  -- estado siga en 'processing' — si otro proceso reclamó una fila vencida
  -- mientras el worker original seguía "vivo" pero lento, el worker original
  -- pierde el lease (su token quedó obsoleto) y su intento de completar no
  -- tiene efecto. Se limpia (vuelve a null) apenas la fila deja 'processing'.
  claim_token              uuid,

  -- Política de reintentos.
  attempt_count            integer not null default 1 check (attempt_count >= 1),
  max_attempts             integer not null default 5 check (max_attempts >= 1),
  -- null = todavía no se clasificó (fila nunca falló, o sigue en processing).
  -- true = falla recuperable, candidata a reintento (sujeto a backoff y a
  --        max_attempts) — siempre con next_retry_at seteado (ver invariante
  --        más abajo; "reintentar ya" se expresa con next_retry_at = now(),
  --        nunca con null). false = falla permanente, nunca se vuelve a
  --        reclamar, y nunca conserva next_retry_at.
  retryable                boolean,
  next_retry_at            timestamptz,

  processing_started_at    timestamptz not null default now(),
  last_attempt_at          timestamptz not null default now(),
  -- Cuándo terminó (con éxito, falla, o skip) el intento más reciente. null
  -- mientras la fila está en 'processing'. Se limpia de nuevo al reclamar.
  completed_at             timestamptz,
  error_code                text check (char_length(error_code) <= 100),
  error_message             text check (char_length(error_message) <= 500),

  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),

  constraint notification_log_channel_mode_dedup_key
    unique (channel, delivery_mode, deduplication_key),

  -- Invariantes del ciclo de vida (defensa en profundidad: además de que la
  -- lógica de las RPC ya las respeta, quedan garantizadas a nivel de fila).
  constraint notification_log_failed_requires_retryable
    check (status <> 'failed' or retryable is not null),
  constraint notification_log_processing_requires_claim_token
    check (status <> 'processing' or claim_token is not null),
  constraint notification_log_retryable_requires_next_retry_at
    check (retryable is distinct from true or next_retry_at is not null),
  constraint notification_log_permanent_has_no_next_retry_at
    check (retryable is distinct from false or next_retry_at is null),
  constraint notification_log_attempt_count_within_max
    check (attempt_count <= max_attempts)
);

create index if not exists notification_log_reservation_id_idx
  on public.notification_log (reservation_id);
create index if not exists notification_log_status_processing_idx
  on public.notification_log (status, processing_started_at)
  where status = 'processing';
create index if not exists notification_log_status_retry_idx
  on public.notification_log (next_retry_at)
  where status = 'failed' and retryable = true;

-- Guarda contra que dos filas terminen apuntando al mismo mensaje del MISMO
-- proveedor (ej. un bug que reenvíe y el proveedor devuelva el mismo id). Se
-- incluye `channel` en el índice a propósito: no asumimos que WhatsApp Cloud
-- API y Resend (proveedores distintos) jamás puedan coincidir en el formato o
-- valor de un id de mensaje. Índice parcial: múltiples filas en 'processing'
-- (provider_message_id null) no chocan entre sí.
create unique index if not exists notification_log_channel_provider_message_id_key
  on public.notification_log (channel, provider_message_id)
  where provider_message_id is not null;

drop trigger if exists notification_log_set_updated_at on public.notification_log;
create trigger notification_log_set_updated_at
  before update on public.notification_log
  for each row execute function public.set_updated_at();

alter table public.notification_log enable row level security;

-- Sin CREATE POLICY: con RLS habilitado y ninguna policy, anon/authenticated
-- no pueden leer ni escribir ni una fila (mismo patrón que el resto de las
-- tablas del proyecto). Solo service role opera esta tabla, y únicamente a
-- través de las dos RPC de abajo (ambas con EXECUTE revocado a
-- public/anon/authenticated — ver los `revoke` después de cada función).


-- ─── RPC claim_notification_attempt ────────────────────────────────────────────
-- Reclama atómicamente el derecho a enviar una notificación ANTES de llamar a
-- WhatsApp/Resend. Nunca se debe insertar/actualizar la fila después de enviar.
--
-- Casos:
--   1. No existe fila para (channel, delivery_mode, deduplication_key) -> se
--      inserta en 'processing' con un claim_token nuevo, claimed = true.
--   2. Existe fila 'failed' con retryable = true, next_retry_at vencido, y
--      attempt_count < max_attempts -> se reclama de nuevo (nuevo claim_token,
--      attempt_count + 1), claimed = true.
--   3. Existe fila 'processing' pero processing_started_at es más viejo que
--      p_stale_after_minutes (proceso caído/colgado) y attempt_count <
--      max_attempts -> se reclama de nuevo (nuevo claim_token que invalida el
--      anterior), claimed = true. Este es el mecanismo de recuperación de
--      notificaciones huérfanas: no hay job de limpieza aparte, el próximo
--      intento destraba la fila vencida.
--   4. Existe fila 'failed' con retryable = false (permanente), o con
--      attempt_count >= max_attempts (reintentos agotados), o 'processing'
--      reciente, o en un estado terminal de éxito ('sent'/'delivered'/'read'),
--      o 'skipped' -> NO se reclama, claimed = false, claim_token = null.
--
-- El llamador (TS) debe chequear `claimed`: si es false, no debe enviar nada.
-- El `claim_token` devuelto es el que hay que pasarle después a
-- complete_notification_attempt; si para cuando se intenta completar otro
-- proceso ya reclamó la fila (vencida), el token quedó obsoleto y el complete
-- no tiene efecto (ver esa función).
--
-- SECURITY DEFINER + search_path fijo: la función corre con los privilegios
-- de su dueño (necesario para poder escribir en notification_log pese a que
-- RLS no tiene policies para anon/authenticated), así que fijamos
-- search_path explícitamente para que ninguna referencia sin calificar dentro
-- del cuerpo pueda resolverse contra un esquema inesperado.

create or replace function public.claim_notification_attempt(
  p_channel               text,
  p_deduplication_key     text,
  p_event_type            text,
  p_recipient             text,
  p_reservation_id        uuid,
  p_class_id              uuid,
  p_template_name         text,
  p_payload               jsonb default '{}'::jsonb,
  p_delivery_mode         text default 'live',
  p_max_attempts          integer default 5,
  p_stale_after_minutes   integer default 10
)
returns table (
  id             uuid,
  claim_token    uuid,
  attempt_count  integer,
  claimed        boolean
)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_new_token uuid := gen_random_uuid();
begin
  if p_delivery_mode not in ('live', 'dry_run') then
    raise exception 'claim_notification_attempt: delivery_mode inválido "%": solo live|dry_run', p_delivery_mode;
  end if;

  return query
  insert into public.notification_log as nl (
    channel, delivery_mode, deduplication_key, event_type, recipient,
    reservation_id, class_id, template_name, payload,
    status, claim_token, attempt_count, max_attempts,
    processing_started_at, last_attempt_at, completed_at
  )
  values (
    p_channel, p_delivery_mode, p_deduplication_key, p_event_type, p_recipient,
    p_reservation_id, p_class_id, p_template_name, coalesce(p_payload, '{}'::jsonb),
    'processing', v_new_token, 1, greatest(p_max_attempts, 1),
    now(), now(), null
  )
  on conflict (channel, delivery_mode, deduplication_key) do update
    set status                 = 'processing',
        claim_token            = v_new_token,
        attempt_count          = nl.attempt_count + 1,
        max_attempts           = greatest(p_max_attempts, 1),
        template_name          = p_template_name,
        payload                = coalesce(p_payload, '{}'::jsonb),
        processing_started_at  = now(),
        last_attempt_at        = now(),
        completed_at           = null,
        error_code             = null,
        error_message          = null,
        retryable              = null,
        next_retry_at          = null
    where nl.attempt_count < nl.max_attempts
      and (
            (
              nl.status = 'failed'
              and nl.retryable is true
              and nl.next_retry_at <= now()
            )
            or (
              nl.status = 'processing'
              and nl.processing_started_at < now() - make_interval(mins => p_stale_after_minutes)
            )
          )
  returning nl.id, nl.claim_token, nl.attempt_count, true as claimed;

  if not found then
    -- Conflicto existente pero no cumplía ninguna condición de reclamo (ya
    -- resuelta, permanente, reintentos agotados, backoff vigente, o
    -- 'processing' vigente de otro intento en curso). No se expone el
    -- claim_token real: quien no ganó el reclamo no tiene por qué poder
    -- completar la fila.
    return query
    select nl.id, null::uuid as claim_token, nl.attempt_count, false as claimed
    from public.notification_log nl
    where nl.channel = p_channel
      and nl.delivery_mode = p_delivery_mode
      and nl.deduplication_key = p_deduplication_key;
  end if;
end;
$$;

revoke all on function public.claim_notification_attempt(
  text, text, text, text, uuid, uuid, text, jsonb, text, integer, integer
) from public, anon, authenticated;

-- El REVOKE de PUBLIC no le quita a service_role ningún grant que no haya
-- recibido explícitamente: no asumimos que "no está en la lista del REVOKE"
-- equivale a "puede ejecutar". service_role solo puede llamar a esta RPC
-- porque se lo otorgamos acá, explícitamente, con la firma exacta de la
-- función (ver test de integración, sección 9, que lo verifica bajo
-- `SET ROLE service_role` real, no como superusuario).
grant execute on function public.claim_notification_attempt(
  text, text, text, text, uuid, uuid, text, jsonb, text, integer, integer
) to service_role;


-- ─── RPC complete_notification_attempt ─────────────────────────────────────────
-- Persiste el resultado de un intento ya reclamado (envío exitoso, fallido, o
-- deliberadamente no enviado por estar deshabilitado/dry-run). Exige el
-- claim_token exacto y que la fila SIGA en 'processing': si otro proceso ya
-- reclamó esta fila de nuevo (porque el lease anterior venció), el token no
-- coincide (o el status ya cambió) y esta llamada no actualiza nada — devuelve
-- false para que el worker que perdió el lease se entere y NO reporte éxito
-- falso ni pise un resultado más nuevo.
--
-- No maneja 'delivered'/'read': esos son actualizaciones de estado de entrega
-- que llegan más tarde por webhook, identificadas por provider_message_id, no
-- por un claim en curso — se resuelven con una función aparte (fuera del
-- alcance de esta etapa).
--
-- Reglas de retry que esta función fuerza (además de las CHECK de la tabla):
--   - p_status='failed' exige p_retryable no nulo.
--   - p_retryable=true exige next_retry_at: si no se pasa uno explícito, se
--     usa now() (reintentable de inmediato) — nunca se deja null.
--   - p_retryable=false (permanente) fuerza next_retry_at a null, sin
--     importar qué se haya pasado.

create or replace function public.complete_notification_attempt(
  p_id                   uuid,
  p_claim_token          uuid,
  p_status               text,
  p_provider_message_id  text default null,
  p_error_code           text default null,
  p_error_message        text default null,
  p_retryable            boolean default null,
  p_next_retry_at        timestamptz default null
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_row_count      integer;
  v_next_retry_at  timestamptz;
begin
  if p_status not in ('sent', 'failed', 'skipped') then
    raise exception
      'complete_notification_attempt: status inválido "%": solo sent|failed|skipped (delivered/read se actualizan aparte, vía webhook)',
      p_status;
  end if;

  if p_status = 'failed' and p_retryable is null then
    raise exception
      'complete_notification_attempt: p_retryable es obligatorio cuando p_status = failed';
  end if;

  -- Fuerza el invariante retryable<->next_retry_at en vez de confiar en que
  -- el llamador siempre lo arme bien: true sin fecha explícita = "ya",
  -- false siempre limpia la fecha.
  if p_retryable is true then
    v_next_retry_at := coalesce(p_next_retry_at, now());
  elsif p_retryable is false then
    v_next_retry_at := null;
  else
    v_next_retry_at := null;
  end if;

  update public.notification_log
  set status               = p_status,
      provider_message_id  = coalesce(p_provider_message_id, provider_message_id),
      error_code           = left(p_error_code, 100),
      error_message        = left(p_error_message, 500),
      retryable            = p_retryable,
      next_retry_at        = v_next_retry_at,
      claim_token          = null,
      last_attempt_at      = now(),
      completed_at         = now()
  where id = p_id
    and claim_token = p_claim_token
    and status = 'processing';

  get diagnostics v_row_count = row_count;
  return v_row_count > 0;
end;
$$;

revoke all on function public.complete_notification_attempt(
  uuid, uuid, text, text, text, text, boolean, timestamptz
) from public, anon, authenticated;

grant execute on function public.complete_notification_attempt(
  uuid, uuid, text, text, text, text, boolean, timestamptz
) to service_role;
