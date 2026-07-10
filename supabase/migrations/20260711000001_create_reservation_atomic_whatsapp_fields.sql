-- Extiende create_reservation_atomic para persistir, DENTRO de la misma
-- transacción que crea la reserva, el teléfono normalizado y el
-- consentimiento de WhatsApp — nunca en un UPDATE separado después.
--
-- Motivo: un UPDATE best-effort posterior a la RPC no da ninguna garantía de
-- que "WhatsApp solo se intenta si el consentimiento quedó efectivamente
-- persistido" — si ese UPDATE fallara (o simplemente no se esperara su
-- resultado), el dispatcher podía terminar usando el consentimiento
-- recibido del formulario en memoria, no el que realmente quedó en la base.
-- Reverse-engineered a mano para esta fase (no ejecutada aún contra el
-- proyecto real). Verificar contra el schema real de Supabase antes de
-- aplicar. Requiere: 20260530000003_block_past_reservations.sql (última
-- versión de create_reservation_atomic antes de este cambio),
-- 20260710000001_reservations_whatsapp_consent.sql (columnas
-- whatsapp_consent/whatsapp_consent_at, sin constraint todavía — el
-- constraint completo de consistencia se agrega acá, ahora que también
-- existe customer_phone_normalized).

-- ─── Columna customer_phone_normalized ─────────────────────────────────────────
-- customer_phone se conserva intacto (lo que tipeó la persona). Esta columna
-- nueva es el E.164 que realmente usa WhatsApp, calculado UNA VEZ en el
-- servidor (lib/whatsapp/phone.ts::normalizeArgentinePhone) antes de llamar
-- a la RPC — la RPC no reimplementa el parseo de teléfonos, solo persiste el
-- valor ya validado. Nullable: no hay teléfono, o no se pudo normalizar (en
-- cuyo caso el request ya se rechazó con 400 antes de llegar acá — ver
-- app/api/reservations/route.ts). No se migran ni normalizan teléfonos
-- históricos: en filas viejas esta columna simplemente queda null, lo cual
-- ya alcanza para que el dispatcher trate esas reservas como "sin teléfono
-- para WhatsApp" (comportamiento seguro, igual que hoy).
--
-- Es válido tener un teléfono normalizado con whatsapp_consent=false: el
-- teléfono puede guardarse como dato de contacto general sin que eso
-- autorice notificaciones automáticas por WhatsApp (ver constraint más
-- abajo — no exige lo contrario).
--
-- Sin índice: no hay ninguna consulta actual en el código que filtre o
-- busque reservas por customer_phone_normalized (se usa solo de punta a
-- punta: se escribe acá y se relee por customer_phone_normalized ligado a
-- un `id` puntual — app/api/reservations/route.ts,
-- lib/admin/reservas-actions.ts —, nunca como criterio de búsqueda). Si en
-- el futuro aparece un caso de uso real (ej. buscar reservas por teléfono
-- en el panel admin), agregar el índice en una migración aparte junto con
-- esa funcionalidad.

alter table public.reservations
  add column if not exists customer_phone_normalized text;


-- ─── Constraint de consistencia (definitivo) ───────────────────────────────────
-- Reemplaza al parcial de 20260710000001 (que solo relacionaba
-- whatsapp_consent con whatsapp_consent_at, sin poder considerar el
-- teléfono porque esa columna no existía todavía en esa migración).
--
--   whatsapp_consent = true  -> whatsapp_consent_at NOT NULL
--                            -> customer_phone_normalized NOT NULL y no vacío/blanco
--   whatsapp_consent = false -> whatsapp_consent_at IS NULL
--
-- (customer_phone_normalized SIEMPRE puede ser NOT NULL con
-- whatsapp_consent=false: el teléfono como dato de contacto general no
-- requiere autorización para notificaciones automáticas.)
--
-- nullif(trim(...), '') is not null descarta NULL, '' y cadenas compuestas
-- solo por espacios — no alcanza con "IS NOT NULL" a secas.

alter table public.reservations
  drop constraint if exists reservations_whatsapp_consent_at_requires_consent;

alter table public.reservations
  drop constraint if exists reservations_whatsapp_consent_consistency;

alter table public.reservations
  add constraint reservations_whatsapp_consent_consistency
  check (
    (
      whatsapp_consent = true
      and whatsapp_consent_at is not null
      and nullif(trim(customer_phone_normalized), '') is not null
    )
    or
    (
      whatsapp_consent = false
      and whatsapp_consent_at is null
    )
  );


-- ─── RPC create_reservation_atomic (nueva aridad: 10 parámetros) ──────────────
-- IMPORTANTE (mismo problema que ya resolvió
-- 20260601000001_drop_old_rpc_overload.sql): CREATE OR REPLACE FUNCTION no
-- reemplaza una función existente si cambia la aridad — crea una SEGUNDA
-- sobrecarga con el mismo nombre, y PostgREST tira PGRST203 por ambigüedad
-- al no poder elegir cuál llamar. Por eso primero se elimina explícitamente
-- la versión vieja de 7 parámetros antes de crear la de 10.

drop function if exists public.create_reservation_atomic(
  uuid, text, text, text, text, text, integer
);

create or replace function public.create_reservation_atomic(
  p_class_id                    uuid,
  p_customer_email              text,
  p_customer_name               text,
  p_customer_phone              text,
  p_idempotency_key             text,
  p_notes                       text,
  p_spots                       integer,
  p_customer_phone_normalized   text default null,
  p_whatsapp_consent            boolean default false,
  p_whatsapp_consent_at         timestamptz default null
)
returns table (
  reservation_id  uuid,
  was_created     boolean,
  error_code      text
)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_class         public.classes%rowtype;
  v_spots_taken   integer;
  v_existing_id   uuid;
  v_new_id        uuid;
  v_consent_at    timestamptz;
begin

  -- ── Idempotencia ── (sin cambios de comportamiento) — se chequea PRIMERO:
  -- una réplica por idempotency_key devuelve la reserva existente tal cual
  -- fue creada originalmente, sin usar (y por lo tanto sin necesitar
  -- validar) los parámetros nuevos de este request repetido.
  if p_idempotency_key is not null then
    select id into v_existing_id
    from public.reservations
    where idempotency_key = p_idempotency_key
    limit 1;

    if v_existing_id is not null then
      return query select v_existing_id, false, null::text;
      return;
    end if;
  end if;

  -- ── Validación de dominio: consentimiento sin teléfono normalizado ──────────
  -- Refuerza en la propia RPC lo que ya exige el constraint de tabla, con un
  -- error identificable ANTES de tocar la clase (bloqueo, cupos) o intentar
  -- el INSERT — así un caller que se equivoca recibe un mensaje claro en
  -- vez de una violación de constraint genérica.
  if p_whatsapp_consent
     and nullif(trim(p_customer_phone_normalized), '') is null then
    raise exception 'invalid_whatsapp_consent: normalized phone is required';
  end if;

  -- Consentimiento verdadero sin fecha explícita recibe now(); falso ignora
  -- cualquier fecha recibida y persiste null (mismo comportamiento que ya
  -- fuerza complete_notification_attempt para retryable/next_retry_at).
  if p_whatsapp_consent then
    v_consent_at := coalesce(p_whatsapp_consent_at, now());
  else
    v_consent_at := null;
  end if;

  -- ── Leer y bloquear la clase ── (sin cambios)
  select * into v_class
  from public.classes
  where id = p_class_id
  for update;

  if not found then
    raise exception 'not_available: class not found';
  end if;

  if v_class.is_cancelled then
    raise exception 'cancelled: class is cancelled';
  end if;

  if v_class.date < current_date then
    raise exception 'not_available: class date has passed';
  end if;

  -- ── Verificar cupos ── (sin cambios)
  select coalesce(sum(spots), 0) into v_spots_taken
  from public.reservations
  where class_id = p_class_id
    and status in ('pending', 'confirmed');

  if (v_class.total_spots - v_spots_taken) < p_spots then
    raise exception 'not_available: not enough spots';
  end if;

  -- ── Verificar reserva duplicada (mismo email + clase activa, sin idempotency key) ──
  if p_idempotency_key is null then
    if exists (
      select 1 from public.reservations
      where class_id = p_class_id
        and customer_email = p_customer_email
        and status in ('pending', 'confirmed')
    ) then
      raise exception 'duplicate: reservation already exists for this email and class';
    end if;
  end if;

  -- ── Insertar (ahora también teléfono normalizado + consentimiento) ──
  insert into public.reservations (
    class_id,
    customer_name,
    customer_email,
    customer_phone,
    customer_phone_normalized,
    notes,
    spots,
    status,
    idempotency_key,
    whatsapp_consent,
    whatsapp_consent_at
  ) values (
    p_class_id,
    p_customer_name,
    p_customer_email,
    p_customer_phone,
    p_customer_phone_normalized,
    p_notes,
    p_spots,
    'pending',
    p_idempotency_key,
    p_whatsapp_consent,
    v_consent_at
  )
  returning id into v_new_id;

  return query select v_new_id, true, null::text;

end;
$$;

revoke all on function public.create_reservation_atomic(
  uuid, text, text, text, text, text, integer, text, boolean, timestamptz
) from public, anon, authenticated;

-- Igual que en 20260709000001_notification_log.sql: no asumimos que
-- service_role conserva acceso implícito solo por no estar en el REVOKE de
-- arriba — se lo otorgamos de forma explícita.
grant execute on function public.create_reservation_atomic(
  uuid, text, text, text, text, text, integer, text, boolean, timestamptz
) to service_role;

-- PostgREST cachea el schema de funciones/columnas al arrancar; sin este
-- reload, la API seguiría viendo la firma vieja de 7 parámetros (o ninguna,
-- si el proceso no había visto la función todavía) hasta el próximo reinicio
-- del pooler. Debe ir después de crear la función y de configurar sus
-- permisos, no antes.
notify pgrst, 'reload schema';
