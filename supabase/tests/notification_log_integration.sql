-- Prueba de integración manual de notification_log + sus RPC
-- (claim_notification_attempt / complete_notification_attempt).
--
-- NO es parte de las migraciones — no se aplica sola ni la corre
-- `supabase db reset`. Es un script de verificación manual.
--
-- Requiere que las migraciones ya estén aplicadas en la base contra la que
-- se corre (en particular 20260519000001_classes.sql,
-- 20260519000002_reservations.sql y 20260709000001_notification_log.sql).
--
-- Cómo correrla contra Supabase local:
--   supabase start
--   supabase db reset
--   psql "$(supabase status -o env | grep DB_URL | cut -d= -f2- | tr -d '\"')" \
--        -v ON_ERROR_STOP=1 -f supabase/tests/notification_log_integration.sql
--
-- O contra cualquier Postgres/Supabase de staging con las migraciones ya
-- aplicadas:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/notification_log_integration.sql
--
-- NUNCA correr esto contra producción: inserta filas de prueba (aunque
-- termina en ROLLBACK, ver abajo) y hace SET ROLE a anon/authenticated.
--
-- El script entero corre dentro de una transacción que termina en ROLLBACK
-- a propósito — no deja datos de prueba en la base pase lo que pase (salvo
-- que el script aborte antes del BEGIN, lo cual no debería ocurrir).
--
-- Salida: cada aserción imprime "PASS: ..." (NOTICE) o aborta todo el script
-- con "FAIL: ..." (EXCEPTION, no atrapable por ON_ERROR_STOP → psql sale con
-- código de error). Éxito = el script corre hasta el final sin ningún FAIL y
-- psql termina con exit code 0.

\set ON_ERROR_STOP on

begin;

-- Roles anon/authenticated/service_role: en un proyecto Supabase real ya
-- existen. Acá los creamos solo si faltan (para poder correr este script
-- también contra un Postgres liso sin el stack completo de Supabase).
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin;
  end if;
end $$;

create temp table test_state (key text primary key, value text);
-- Este script hace SET ROLE a anon/authenticated/service_role más abajo; sin
-- este grant, service_role no podría ni siquiera guardar su propio
-- claim_token en esta tabla de scratch del test (nada que ver con los
-- permisos que se están probando sobre notification_log).
grant select, insert, update on test_state to anon, authenticated, service_role;

create or replace function pg_temp.assert(p_condition boolean, p_label text)
returns void language plpgsql as $$
begin
  if not p_condition then
    raise exception 'FAIL: %', p_label;
  end if;
  raise notice 'PASS: %', p_label;
end;
$$;

-- ─── Fixtures ──────────────────────────────────────────────────────────────

insert into public.classes (
  id, slug, title, date, start_time, end_time, category_event, category_label, total_spots
) values (
  '11111111-1111-1111-1111-111111111111', 'integration-test-clase', 'Clase de test (integration)',
  current_date + 7, '10:00', '12:00', 'adultos', 'Test', 10
);

insert into public.reservations (
  id, class_id, customer_name, customer_email, customer_phone, spots, status
) values (
  '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
  'Cliente Test', 'test@example.com', '+5491123456789', 1, 'pending'
);


-- ─── 1. Claim inicial ──────────────────────────────────────────────────────

do $$
declare
  v_id uuid; v_token uuid; v_attempts int; v_claimed boolean;
begin
  select id, claim_token, attempt_count, claimed
    into v_id, v_token, v_attempts, v_claimed
  from public.claim_notification_attempt(
    p_channel => 'whatsapp',
    p_deduplication_key => 'pago_confirmado:22222222-2222-2222-2222-222222222222',
    p_event_type => 'pago_confirmado',
    p_recipient => '+5491123456789',
    p_reservation_id => '22222222-2222-2222-2222-222222222222',
    p_class_id => '11111111-1111-1111-1111-111111111111',
    p_template_name => 'pago_confirmado_v1',
    p_payload => '{"customerName":"Cliente Test"}'::jsonb,
    p_delivery_mode => 'live',
    p_max_attempts => 3,
    p_stale_after_minutes => 1
  );
  perform pg_temp.assert(v_claimed = true, '1. claim inicial: claimed=true');
  perform pg_temp.assert(v_token is not null, '1. claim inicial: claim_token no nulo');
  perform pg_temp.assert(v_attempts = 1, '1. claim inicial: attempt_count=1');
  insert into test_state values ('claim1_id', v_id::text), ('claim1_token', v_token::text)
    on conflict (key) do update set value = excluded.value;
end $$;


-- ─── 2. Claim concurrente rechazado ────────────────────────────────────────
-- Mismo (channel, delivery_mode, deduplication_key) mientras la fila sigue
-- 'processing' y fresca. Ejercita el mismo camino atómico
-- (INSERT ... ON CONFLICT DO UPDATE ... WHERE) que protege a dos
-- transacciones concurrentes reales: Postgres serializa cualquier escritor
-- sobre la misma fila en conflicto, así que un segundo reclamo secuencial
-- prueba exactamente la misma condición WHERE que un segundo reclamo
-- concurrente vería.

do $$
declare v_claimed boolean; v_token uuid;
begin
  select claimed, claim_token into v_claimed, v_token
  from public.claim_notification_attempt(
    p_channel => 'whatsapp',
    p_deduplication_key => 'pago_confirmado:22222222-2222-2222-2222-222222222222',
    p_event_type => 'pago_confirmado',
    p_recipient => '+5491123456789',
    p_reservation_id => '22222222-2222-2222-2222-222222222222',
    p_class_id => '11111111-1111-1111-1111-111111111111',
    p_template_name => 'pago_confirmado_v1',
    p_delivery_mode => 'live',
    p_stale_after_minutes => 1
  );
  perform pg_temp.assert(v_claimed = false, '2. claim concurrente sobre fila processing fresca: rechazado');
  perform pg_temp.assert(v_token is null, '2. claim concurrente rechazado: no expone claim_token');
end $$;


-- ─── 3. Recuperación de lease vencido ──────────────────────────────────────

update public.notification_log
set processing_started_at = now() - interval '5 minutes'
where id = (select value::uuid from test_state where key = 'claim1_id');

do $$
declare v_claimed boolean; v_token uuid; v_attempts int; v_old_token uuid;
begin
  select value::uuid into v_old_token from test_state where key = 'claim1_token';

  select claimed, claim_token, attempt_count into v_claimed, v_token, v_attempts
  from public.claim_notification_attempt(
    p_channel => 'whatsapp',
    p_deduplication_key => 'pago_confirmado:22222222-2222-2222-2222-222222222222',
    p_event_type => 'pago_confirmado',
    p_recipient => '+5491123456789',
    p_reservation_id => '22222222-2222-2222-2222-222222222222',
    p_class_id => '11111111-1111-1111-1111-111111111111',
    p_template_name => 'pago_confirmado_v1',
    p_delivery_mode => 'live',
    p_max_attempts => 3,
    p_stale_after_minutes => 1
  );
  perform pg_temp.assert(v_claimed = true, '3. recuperación de lease vencido (5min > umbral 1min): claimed=true');
  perform pg_temp.assert(v_attempts = 2, '3. recuperación de lease vencido: attempt_count incrementado a 2');
  perform pg_temp.assert(v_token is distinct from v_old_token, '3. recuperación de lease vencido: claim_token nuevo, distinto del anterior');

  insert into test_state values ('claim2_token', v_token::text)
    on conflict (key) do update set value = excluded.value;
end $$;


-- ─── 4. Finalización con token viejo rechazada ─────────────────────────────
-- El worker "original" (dueño de claim1_token) intenta completar después de
-- que otro proceso ya recuperó el lease vencido en el paso 3.

do $$
declare v_old_token uuid; v_id uuid; v_updated boolean;
begin
  select value::uuid into v_old_token from test_state where key = 'claim1_token';
  select value::uuid into v_id from test_state where key = 'claim1_id';

  select public.complete_notification_attempt(
    p_id => v_id,
    p_claim_token => v_old_token,
    p_status => 'sent',
    p_provider_message_id => 'wamid.should-not-persist'
  ) into v_updated;

  perform pg_temp.assert(v_updated = false, '4. finalización con claim_token viejo (lease perdido): updated=false');
end $$;

-- Confirma que el intento con token viejo NO pisó nada: la fila sigue en
-- 'processing' con el claim_token nuevo del paso 3, no con provider_message_id.
do $$
declare v_status text; v_provider text; v_token uuid; v_expected_token uuid;
begin
  select value::uuid into v_expected_token from test_state where key = 'claim2_token';
  select status, provider_message_id, claim_token into v_status, v_provider, v_token
  from public.notification_log where id = (select value::uuid from test_state where key = 'claim1_id');

  perform pg_temp.assert(v_status = 'processing', '4b. la fila sigue en processing tras el intento con token viejo');
  perform pg_temp.assert(v_provider is null, '4b. provider_message_id NO quedó seteado por el token viejo');
  perform pg_temp.assert(v_token = v_expected_token, '4b. el claim_token vigente sigue siendo el del reclamo nuevo (paso 3)');
end $$;


-- ─── 5. Espera de next_retry_at ────────────────────────────────────────────

do $$
declare v_id uuid; v_token uuid; v_updated boolean;
begin
  select value::uuid into v_id from test_state where key = 'claim1_id';
  select value::uuid into v_token from test_state where key = 'claim2_token';

  select public.complete_notification_attempt(
    p_id => v_id, p_claim_token => v_token, p_status => 'failed',
    p_error_code => 'timeout', p_error_message => 'simulated timeout',
    p_retryable => true, p_next_retry_at => now() + interval '1 hour'
  ) into v_updated;

  perform pg_temp.assert(v_updated = true, '5a. complete failed+retryable con backoff futuro: updated=true');
end $$;

do $$
declare v_status text; v_retryable boolean; v_next timestamptz; v_claim_token uuid; v_completed_at timestamptz;
begin
  select status, retryable, next_retry_at, claim_token, completed_at
    into v_status, v_retryable, v_next, v_claim_token, v_completed_at
  from public.notification_log where id = (select value::uuid from test_state where key = 'claim1_id');

  perform pg_temp.assert(v_status = 'failed', '5b. status=failed persistido');
  perform pg_temp.assert(v_retryable = true, '5b. retryable=true persistido');
  perform pg_temp.assert(v_next is not null and v_next > now(), '5b. next_retry_at quedó seteado en el futuro (invariante: recuperable siempre tiene next_retry_at)');
  perform pg_temp.assert(v_claim_token is null, '5b. claim_token se limpió al completar (lease liberado)');
  perform pg_temp.assert(v_completed_at is not null, '5b. completed_at quedó seteado');
end $$;

do $$
declare v_claimed boolean;
begin
  select claimed into v_claimed
  from public.claim_notification_attempt(
    p_channel => 'whatsapp', p_deduplication_key => 'pago_confirmado:22222222-2222-2222-2222-222222222222',
    p_event_type => 'pago_confirmado', p_recipient => '+5491123456789',
    p_reservation_id => '22222222-2222-2222-2222-222222222222', p_class_id => '11111111-1111-1111-1111-111111111111',
    p_template_name => 'pago_confirmado_v1', p_delivery_mode => 'live', p_max_attempts => 3, p_stale_after_minutes => 1
  );
  perform pg_temp.assert(v_claimed = false, '5c. reclamo antes de next_retry_at: rechazado (backoff vigente)');
end $$;

update public.notification_log
set next_retry_at = now() - interval '1 minute'
where id = (select value::uuid from test_state where key = 'claim1_id');

do $$
declare v_claimed boolean; v_attempts int; v_token uuid;
begin
  select claimed, attempt_count, claim_token into v_claimed, v_attempts, v_token
  from public.claim_notification_attempt(
    p_channel => 'whatsapp', p_deduplication_key => 'pago_confirmado:22222222-2222-2222-2222-222222222222',
    p_event_type => 'pago_confirmado', p_recipient => '+5491123456789',
    p_reservation_id => '22222222-2222-2222-2222-222222222222', p_class_id => '11111111-1111-1111-1111-111111111111',
    p_template_name => 'pago_confirmado_v1', p_delivery_mode => 'live', p_max_attempts => 3, p_stale_after_minutes => 1
  );
  perform pg_temp.assert(v_claimed = true, '5d. reclamo tras vencer next_retry_at: claimed=true');
  perform pg_temp.assert(v_attempts = 3, '5d. attempt_count incrementado a 3');

  insert into test_state values ('claim3_token', v_token::text)
    on conflict (key) do update set value = excluded.value;
end $$;


-- ─── 6. Máximo de intentos ─────────────────────────────────────────────────
-- max_attempts=3 desde el paso 1. attempt_count ya está en 3 (paso 5d).

do $$
declare v_id uuid; v_token uuid; v_updated boolean;
begin
  select value::uuid into v_id from test_state where key = 'claim1_id';
  select value::uuid into v_token from test_state where key = 'claim3_token';

  select public.complete_notification_attempt(
    p_id => v_id, p_claim_token => v_token, p_status => 'failed',
    p_error_code => 'timeout', p_error_message => 'simulated timeout again',
    p_retryable => true, p_next_retry_at => now() - interval '1 minute'
  ) into v_updated;

  perform pg_temp.assert(v_updated = true, '6a. complete failed en el último intento permitido: updated=true');
end $$;

do $$
declare v_claimed boolean;
begin
  select claimed into v_claimed
  from public.claim_notification_attempt(
    p_channel => 'whatsapp', p_deduplication_key => 'pago_confirmado:22222222-2222-2222-2222-222222222222',
    p_event_type => 'pago_confirmado', p_recipient => '+5491123456789',
    p_reservation_id => '22222222-2222-2222-2222-222222222222', p_class_id => '11111111-1111-1111-1111-111111111111',
    p_template_name => 'pago_confirmado_v1', p_delivery_mode => 'live', p_max_attempts => 3, p_stale_after_minutes => 1
  );
  perform pg_temp.assert(v_claimed = false, '6b. máximo de intentos agotado (attempt_count=max_attempts=3): no se reclama aunque retryable=true y next_retry_at vencido');
end $$;


-- ─── 7. Error permanente ───────────────────────────────────────────────────

do $$
declare v_id uuid; v_token uuid; v_claimed boolean;
begin
  select id, claim_token, claimed into v_id, v_token, v_claimed
  from public.claim_notification_attempt(
    p_channel => 'whatsapp', p_deduplication_key => 'cancelacion:22222222-2222-2222-2222-222222222222',
    p_event_type => 'cancelacion', p_recipient => '+5491123456789',
    p_reservation_id => '22222222-2222-2222-2222-222222222222', p_class_id => '11111111-1111-1111-1111-111111111111',
    p_template_name => 'cancelacion_v1', p_delivery_mode => 'live', p_max_attempts => 5, p_stale_after_minutes => 1
  );
  perform pg_temp.assert(v_claimed = true, '7a. claim para caso de error permanente: claimed=true');

  insert into test_state values ('claim_perm_id', v_id::text), ('claim_perm_token', v_token::text)
    on conflict (key) do update set value = excluded.value;
end $$;

do $$
declare v_id uuid; v_token uuid; v_updated boolean; v_next timestamptz; v_retryable boolean;
begin
  select value::uuid into v_id from test_state where key = 'claim_perm_id';
  select value::uuid into v_token from test_state where key = 'claim_perm_token';

  -- A propósito pasamos un next_retry_at futuro junto con retryable=false,
  -- para probar que la función lo ignora y fuerza next_retry_at a null.
  select public.complete_notification_attempt(
    p_id => v_id, p_claim_token => v_token, p_status => 'failed',
    p_error_code => 'template_rejected', p_error_message => 'plantilla no aprobada por Meta',
    p_retryable => false, p_next_retry_at => now() + interval '1 hour'
  ) into v_updated;
  perform pg_temp.assert(v_updated = true, '7b. complete con error permanente: updated=true');

  select next_retry_at, retryable into v_next, v_retryable
  from public.notification_log where id = v_id;
  perform pg_temp.assert(v_retryable = false, '7c. retryable=false persistido');
  perform pg_temp.assert(v_next is null, '7c. next_retry_at forzado a null pese a pasar uno futuro (invariante: permanente nunca conserva next_retry_at)');
end $$;

do $$
declare v_claimed boolean;
begin
  select claimed into v_claimed
  from public.claim_notification_attempt(
    p_channel => 'whatsapp', p_deduplication_key => 'cancelacion:22222222-2222-2222-2222-222222222222',
    p_event_type => 'cancelacion', p_recipient => '+5491123456789',
    p_reservation_id => '22222222-2222-2222-2222-222222222222', p_class_id => '11111111-1111-1111-1111-111111111111',
    p_template_name => 'cancelacion_v1', p_delivery_mode => 'live', p_max_attempts => 5, p_stale_after_minutes => 1
  );
  perform pg_temp.assert(v_claimed = false, '7d. error permanente nunca se reclama de nuevo');
end $$;


-- ─── 8. ON DELETE SET NULL (no CASCADE) ────────────────────────────────────

do $$
declare v_count_before int;
begin
  select count(*) into v_count_before from public.notification_log
  where reservation_id = '22222222-2222-2222-2222-222222222222';
  perform pg_temp.assert(v_count_before >= 2, '8a. hay filas de notification_log ligadas a la reserva de test antes de borrarla');

  insert into test_state values ('count_before_delete', v_count_before::text)
    on conflict (key) do update set value = excluded.value;
end $$;

delete from public.reservations where id = '22222222-2222-2222-2222-222222222222';

do $$
declare v_count_after int; v_null_count int; v_count_before int;
begin
  select value::int into v_count_before from test_state where key = 'count_before_delete';

  select count(*) into v_count_after from public.notification_log
  where id in (
    (select value::uuid from test_state where key = 'claim1_id'),
    (select value::uuid from test_state where key = 'claim_perm_id')
  );
  perform pg_temp.assert(v_count_after = v_count_before, '8b. las filas de notification_log siguen existiendo tras borrar la reserva (no se borraron en cascada)');

  select count(*) into v_null_count from public.notification_log
  where reservation_id is null
    and id in (
      (select value::uuid from test_state where key = 'claim1_id'),
      (select value::uuid from test_state where key = 'claim_perm_id')
    );
  perform pg_temp.assert(v_null_count = v_count_before, '8c. reservation_id quedó en null en todas las filas afectadas (ON DELETE SET NULL)');
end $$;


-- ─── 9. Permisos: RLS, EXECUTE de las RPC, y search_path de SECURITY DEFINER ──

-- 9.0 — Ningún rol no confiable puede CREATE en los esquemas del search_path
-- fijo de las funciones (public, pg_catalog). Si pudieran, un search_path
-- hijack seguiría siendo posible pese al `set search_path` explícito de las
-- RPC. pg_catalog nunca es escribible por un rol no-superusuario en Postgres
-- (no hace falta un GRANT/REVOKE nuestro para eso); 'public' lo confirmamos
-- porque Postgres 15+ revoca CREATE de PUBLIC por defecto en bases nuevas,
-- pero no queremos asumirlo sin chequearlo.
do $$
begin
  perform pg_temp.assert(
    not has_schema_privilege('anon', 'public', 'CREATE'),
    '9.0a anon no tiene CREATE sobre schema public (search_path de las RPC no explotable)'
  );
  perform pg_temp.assert(
    not has_schema_privilege('authenticated', 'public', 'CREATE'),
    '9.0b authenticated no tiene CREATE sobre schema public (search_path de las RPC no explotable)'
  );
  perform pg_temp.assert(
    not has_schema_privilege('anon', 'pg_catalog', 'CREATE'),
    '9.0c anon no tiene CREATE sobre pg_catalog'
  );
  perform pg_temp.assert(
    not has_schema_privilege('authenticated', 'pg_catalog', 'CREATE'),
    '9.0d authenticated no tiene CREATE sobre pg_catalog'
  );
end $$;

-- 9.1 — anon: ninguna de las dos RPC, ni lectura directa de la tabla.

set role anon;

do $$
begin
  begin
    perform public.claim_notification_attempt(
      p_channel => 'whatsapp', p_deduplication_key => 'x', p_event_type => 'cancelacion',
      p_recipient => 'x', p_reservation_id => null, p_class_id => null, p_template_name => null
    );
    perform pg_temp.assert(false, '9a. anon NO debería poder ejecutar claim_notification_attempt');
  exception when insufficient_privilege then
    perform pg_temp.assert(true, '9a. anon: EXECUTE denegado en claim_notification_attempt');
  end;
end $$;

do $$
begin
  begin
    perform public.complete_notification_attempt(
      p_id => gen_random_uuid(), p_claim_token => gen_random_uuid(), p_status => 'sent'
    );
    perform pg_temp.assert(false, '9b. anon NO debería poder ejecutar complete_notification_attempt');
  exception when insufficient_privilege then
    perform pg_temp.assert(true, '9b. anon: EXECUTE denegado en complete_notification_attempt');
  end;
end $$;

do $$
begin
  begin
    perform count(*) from public.notification_log;
    perform pg_temp.assert(false, '9c. anon NO debería poder leer notification_log');
  exception when insufficient_privilege then
    perform pg_temp.assert(true, '9c. anon: SELECT denegado en notification_log');
  end;
end $$;

reset role;

-- 9.2 — authenticated: mismas tres denegaciones.

set role authenticated;

do $$
begin
  begin
    perform public.claim_notification_attempt(
      p_channel => 'whatsapp', p_deduplication_key => 'x', p_event_type => 'cancelacion',
      p_recipient => 'x', p_reservation_id => null, p_class_id => null, p_template_name => null
    );
    perform pg_temp.assert(false, '9d. authenticated NO debería poder ejecutar claim_notification_attempt');
  exception when insufficient_privilege then
    perform pg_temp.assert(true, '9d. authenticated: EXECUTE denegado en claim_notification_attempt');
  end;
end $$;

do $$
begin
  begin
    perform public.complete_notification_attempt(
      p_id => gen_random_uuid(), p_claim_token => gen_random_uuid(), p_status => 'sent'
    );
    perform pg_temp.assert(false, '9e. authenticated NO debería poder ejecutar complete_notification_attempt');
  exception when insufficient_privilege then
    perform pg_temp.assert(true, '9e. authenticated: EXECUTE denegado en complete_notification_attempt');
  end;
end $$;

do $$
begin
  begin
    perform count(*) from public.notification_log;
    perform pg_temp.assert(false, '9f. authenticated NO debería poder leer notification_log');
  exception when insufficient_privilege then
    perform pg_temp.assert(true, '9f. authenticated: SELECT denegado en notification_log');
  end;
end $$;

reset role;

-- 9.3 — service_role: SÍ puede ejecutar ambas RPC (por el GRANT explícito de
-- la migración, no por ser superusuario — corre bajo SET ROLE real, no como
-- el 'postgres' que ejecuta el resto de este script). Y el chequeo de
-- claim_token dentro de complete_notification_attempt sigue aplicando aunque
-- el rol tenga EXECUTE: tener permiso para llamar a la función no alcanza
-- para completar cualquier fila con cualquier token.

set role service_role;

do $$
declare v_id uuid; v_token uuid; v_claimed boolean;
begin
  select id, claim_token, claimed into v_id, v_token, v_claimed
  from public.claim_notification_attempt(
    p_channel => 'whatsapp', p_deduplication_key => 'service_role_check:1', p_event_type => 'cancelacion',
    p_recipient => '+5491123456789', p_reservation_id => null, p_class_id => null, p_template_name => 'x',
    p_delivery_mode => 'live', p_max_attempts => 3, p_stale_after_minutes => 1
  );
  perform pg_temp.assert(v_claimed = true, '9g. service_role SÍ puede ejecutar claim_notification_attempt (claimed=true, bajo SET ROLE real)');

  insert into test_state values ('sr_id', v_id::text), ('sr_token', v_token::text)
    on conflict (key) do update set value = excluded.value;
end $$;

do $$
declare v_id uuid; v_wrong_token uuid; v_updated boolean;
begin
  select value::uuid into v_id from test_state where key = 'sr_id';
  v_wrong_token := gen_random_uuid();

  select public.complete_notification_attempt(
    p_id => v_id, p_claim_token => v_wrong_token, p_status => 'sent', p_provider_message_id => 'wamid.wrong-token'
  ) into v_updated;
  perform pg_temp.assert(v_updated = false, '9h. service_role: EXECUTE otorgado no alcanza para completar con un claim_token incorrecto (updated=false)');
end $$;

do $$
declare v_id uuid; v_token uuid; v_updated boolean;
begin
  select value::uuid into v_id from test_state where key = 'sr_id';
  select value::uuid into v_token from test_state where key = 'sr_token';

  select public.complete_notification_attempt(
    p_id => v_id, p_claim_token => v_token, p_status => 'sent', p_provider_message_id => 'wamid.service-role-ok'
  ) into v_updated;
  perform pg_temp.assert(v_updated = true, '9i. service_role SÍ puede ejecutar complete_notification_attempt con el claim_token correcto (updated=true)');
end $$;

reset role;


-- ─── 10. Dry run sin bloquear posteriormente el modo live ─────────────────

do $$
declare v_id uuid; v_token uuid; v_claimed boolean; v_updated boolean;
begin
  select id, claim_token, claimed into v_id, v_token, v_claimed
  from public.claim_notification_attempt(
    p_channel => 'whatsapp', p_deduplication_key => 'reprogramacion:33333333-3333-3333-3333-333333333333',
    p_event_type => 'reprogramacion', p_recipient => '+5491123456789',
    p_reservation_id => null, p_class_id => null, p_template_name => 'reprogramacion_v1',
    p_delivery_mode => 'dry_run', p_max_attempts => 5, p_stale_after_minutes => 1
  );
  perform pg_temp.assert(v_claimed = true, '10a. claim en delivery_mode=dry_run: claimed=true');

  select public.complete_notification_attempt(
    p_id => v_id, p_claim_token => v_token, p_status => 'skipped',
    p_error_code => 'dry_run', p_error_message => 'simulado, no se llamó al proveedor'
  ) into v_updated;
  perform pg_temp.assert(v_updated = true, '10b. complete dry_run como skipped (nunca sent): updated=true');
end $$;

do $$
declare v_claimed boolean; v_attempts int;
begin
  select claimed, attempt_count into v_claimed, v_attempts
  from public.claim_notification_attempt(
    p_channel => 'whatsapp', p_deduplication_key => 'reprogramacion:33333333-3333-3333-3333-333333333333',
    p_event_type => 'reprogramacion', p_recipient => '+5491123456789',
    p_reservation_id => null, p_class_id => null, p_template_name => 'reprogramacion_v1',
    p_delivery_mode => 'live', p_max_attempts => 5, p_stale_after_minutes => 1
  );
  perform pg_temp.assert(v_claimed = true, '10c. claim en delivery_mode=live para el MISMO dedup key: NO bloqueado por el intento dry_run previo');
  perform pg_temp.assert(v_attempts = 1, '10d. attempt_count=1: es una fila nueva e independiente (channel+delivery_mode+deduplication_key distinto), no un reclamo de la fila dry_run');
end $$;


-- ─── Fin: nunca se deja nada escrito ────────────────────────────────────────
rollback;
