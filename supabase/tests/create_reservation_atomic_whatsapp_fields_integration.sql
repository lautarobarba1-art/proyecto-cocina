-- Prueba de integración manual de la RPC create_reservation_atomic extendida
-- (migración 20260711000001_create_reservation_atomic_whatsapp_fields.sql):
-- teléfono normalizado y consentimiento de WhatsApp persistidos DENTRO de la
-- misma transacción que crea la reserva, con validación de dominio y el
-- constraint de consistencia definitivo.
--
-- NO es parte de las migraciones. Requiere la cadena completa de migraciones
-- de reservations/classes aplicada, en orden, hasta
-- 20260711000001_create_reservation_atomic_whatsapp_fields.sql inclusive
-- (en particular, 20260710000001 ANTES que 20260711000001 — este script no
-- reemplaza la prueba de "compatibilidad desde cero", que corre las
-- migraciones en orden por separado). Corre dentro de una transacción que
-- termina en ROLLBACK. NUNCA correr contra producción.

\set ON_ERROR_STOP on

begin;

create or replace function pg_temp.assert(p_condition boolean, p_label text)
returns void language plpgsql as $$
begin
  if not p_condition then
    raise exception 'FAIL: %', p_label;
  end if;
  raise notice 'PASS: %', p_label;
end;
$$;

insert into public.classes (
  id, slug, title, date, start_time, end_time, category_event, category_label, total_spots
) values (
  '11111111-1111-1111-1111-111111111111', 'rpc-test-clase', 'Clase de test (RPC)',
  current_date + 7, '10:00', '12:00', 'adultos', 'Test', 20
);

-- ─── Llamadas a la RPC que DEBEN funcionar ─────────────────────────────────

do $$
declare v_id uuid; v_created boolean;
begin
  -- consent=false, normalized_phone=NULL
  select reservation_id, was_created into v_id, v_created
  from public.create_reservation_atomic(
    p_class_id => '11111111-1111-1111-1111-111111111111',
    p_customer_email => 'bruno@example.com', p_customer_name => 'Bruno',
    p_customer_phone => null, p_idempotency_key => 'idem-bruno',
    p_notes => null, p_spots => 1,
    p_customer_phone_normalized => null, p_whatsapp_consent => false, p_whatsapp_consent_at => null
  );
  perform pg_temp.assert(v_created = true, 'RPC-OK-1. consent=false + normalized_phone=NULL: acepta');
  perform pg_temp.assert(
    (select whatsapp_consent_at from public.reservations where id = v_id) is null,
    'RPC-OK-1b. whatsapp_consent_at queda NULL'
  );
end $$;

do $$
declare v_id uuid; v_created boolean;
begin
  -- consent=true, normalized_phone válido, consent_at=NULL -> debe autocompletarse
  select reservation_id, was_created into v_id, v_created
  from public.create_reservation_atomic(
    p_class_id => '11111111-1111-1111-1111-111111111111',
    p_customer_email => 'ana@example.com', p_customer_name => 'Ana',
    p_customer_phone => '11 2345 6789', p_idempotency_key => 'idem-ana',
    p_notes => null, p_spots => 1,
    p_customer_phone_normalized => '5491123456789', p_whatsapp_consent => true, p_whatsapp_consent_at => null
  );
  perform pg_temp.assert(v_created = true, 'RPC-OK-2. consent=true + normalized_phone válido + consent_at=NULL: acepta');
  perform pg_temp.assert(
    (select whatsapp_consent_at from public.reservations where id = v_id) is not null,
    'RPC-OK-2b. whatsapp_consent_at se autocompletó con now()'
  );
  perform pg_temp.assert(
    (select customer_phone from public.reservations where id = v_id) = '11 2345 6789',
    'RPC-OK-2c. customer_phone (original) y customer_phone_normalized quedan en columnas separadas: customer_phone conserva el valor tipeado'
  );
  perform pg_temp.assert(
    (select customer_phone_normalized from public.reservations where id = v_id) = '5491123456789',
    'RPC-OK-2d. customer_phone_normalized guarda el E.164'
  );
end $$;

-- ─── Llamadas a la RPC que DEBEN fallar con el error de dominio ────────────

do $$
begin
  begin
    perform public.create_reservation_atomic(
      p_class_id => '11111111-1111-1111-1111-111111111111',
      p_customer_email => 'fail1@example.com', p_customer_name => 'Fail1',
      p_customer_phone => null, p_idempotency_key => 'idem-fail1',
      p_notes => null, p_spots => 1,
      p_customer_phone_normalized => null, p_whatsapp_consent => true, p_whatsapp_consent_at => null
    );
    perform pg_temp.assert(false, 'RPC-FAIL-1. debería rechazar consent=true + normalized_phone=NULL');
  exception when others then
    perform pg_temp.assert(sqlerrm like 'invalid_whatsapp_consent%', 'RPC-FAIL-1. consent=true + normalized_phone=NULL: rechazado con invalid_whatsapp_consent');
  end;
end $$;

do $$
begin
  begin
    perform public.create_reservation_atomic(
      p_class_id => '11111111-1111-1111-1111-111111111111',
      p_customer_email => 'fail2@example.com', p_customer_name => 'Fail2',
      p_customer_phone => null, p_idempotency_key => 'idem-fail2',
      p_notes => null, p_spots => 1,
      p_customer_phone_normalized => '', p_whatsapp_consent => true, p_whatsapp_consent_at => null
    );
    perform pg_temp.assert(false, 'RPC-FAIL-2. debería rechazar consent=true + normalized_phone=vacío');
  exception when others then
    perform pg_temp.assert(sqlerrm like 'invalid_whatsapp_consent%', 'RPC-FAIL-2. consent=true + normalized_phone='''': rechazado con invalid_whatsapp_consent');
  end;
end $$;

do $$
begin
  begin
    perform public.create_reservation_atomic(
      p_class_id => '11111111-1111-1111-1111-111111111111',
      p_customer_email => 'fail3@example.com', p_customer_name => 'Fail3',
      p_customer_phone => null, p_idempotency_key => 'idem-fail3',
      p_notes => null, p_spots => 1,
      p_customer_phone_normalized => '   ', p_whatsapp_consent => true, p_whatsapp_consent_at => null
    );
    perform pg_temp.assert(false, 'RPC-FAIL-3. debería rechazar consent=true + normalized_phone solo espacios');
  exception when others then
    perform pg_temp.assert(sqlerrm like 'invalid_whatsapp_consent%', 'RPC-FAIL-3. consent=true + normalized_phone=''   '': rechazado con invalid_whatsapp_consent');
  end;
end $$;

-- Confirmamos que ninguno de los 3 intentos fallidos insertó nada.
do $$
declare v_count int;
begin
  select count(*) into v_count from public.reservations
  where customer_email in ('fail1@example.com', 'fail2@example.com', 'fail3@example.com');
  perform pg_temp.assert(v_count = 0, 'RPC-FAIL-4. ningún intento rechazado dejó una fila insertada (la validación corre antes del INSERT)');
end $$;

-- ─── Consentimiento falso ignora cualquier fecha recibida ──────────────────

do $$
declare v_id uuid;
begin
  select reservation_id into v_id
  from public.create_reservation_atomic(
    p_class_id => '11111111-1111-1111-1111-111111111111',
    p_customer_email => 'carla@example.com', p_customer_name => 'Carla',
    p_customer_phone => '+5491123456789', p_idempotency_key => 'idem-carla',
    p_notes => null, p_spots => 1,
    p_customer_phone_normalized => '5491123456789', p_whatsapp_consent => false, p_whatsapp_consent_at => now()
  );
  perform pg_temp.assert(
    (select whatsapp_consent_at from public.reservations where id = v_id) is null,
    'CONSENT-FALSE. consent=false con una fecha recibida igual persiste whatsapp_consent_at=NULL'
  );
end $$;

-- ─── Idempotencia: mismo idempotency_key devuelve la misma reserva ─────────

do $$
declare v_id_1 uuid; v_id_2 uuid; v_created_2 boolean;
begin
  select reservation_id into v_id_1
  from public.create_reservation_atomic(
    p_class_id => '11111111-1111-1111-1111-111111111111',
    p_customer_email => 'diego@example.com', p_customer_name => 'Diego',
    p_customer_phone => '+5491123456789', p_idempotency_key => 'idem-diego',
    p_notes => null, p_spots => 1,
    p_customer_phone_normalized => '5491123456789', p_whatsapp_consent => true, p_whatsapp_consent_at => null
  );

  select reservation_id, was_created into v_id_2, v_created_2
  from public.create_reservation_atomic(
    p_class_id => '11111111-1111-1111-1111-111111111111',
    p_customer_email => 'diego@example.com', p_customer_name => 'Diego',
    p_customer_phone => '+5491123456789', p_idempotency_key => 'idem-diego',
    p_notes => null, p_spots => 1,
    p_customer_phone_normalized => '5491123456789', p_whatsapp_consent => true, p_whatsapp_consent_at => null
  );

  perform pg_temp.assert(v_id_1 = v_id_2, 'IDEMP-1. mismo idempotency_key -> misma reservation_id');
  perform pg_temp.assert(v_created_2 = false, 'IDEMP-2. la réplica trae was_created=false');
  perform pg_temp.assert(
    (select count(*) from public.reservations where customer_email = 'diego@example.com') = 1,
    'IDEMP-3. no se insertó una segunda fila'
  );
end $$;

-- ─── Reserva histórica / sin consentimiento sigue siendo válida ───────────

do $$
declare v_id uuid;
begin
  select reservation_id into v_id
  from public.create_reservation_atomic(
    p_class_id => '11111111-1111-1111-1111-111111111111',
    p_customer_email => 'historica@example.com', p_customer_name => 'Historica',
    p_customer_phone => null, p_idempotency_key => 'idem-historica',
    p_notes => null, p_spots => 1
    -- sin pasar los 3 parámetros nuevos: usan sus defaults (null, false, null)
  );
  perform pg_temp.assert(v_id is not null, 'HIST-RPC. reserva sin los parámetros nuevos (defaults) se crea sin problema');
end $$;

-- ─── Cupos: sigue funcionando ───────────────────────────────────────────────
-- Bajamos total_spots al número exacto de cupos ya ocupados por las
-- reservas creadas arriba, para forzar el rechazo por falta de cupo sin
-- tener que contar a mano cuántas reservas activas quedaron.

do $$
declare v_taken int;
begin
  select coalesce(sum(spots),0) into v_taken from public.reservations
  where class_id = '11111111-1111-1111-1111-111111111111' and status in ('pending','confirmed');

  update public.classes set total_spots = v_taken where id = '11111111-1111-1111-1111-111111111111';

  begin
    perform public.create_reservation_atomic(
      p_class_id => '11111111-1111-1111-1111-111111111111',
      p_customer_email => 'sincupo@example.com', p_customer_name => 'Sin Cupo',
      p_customer_phone => null, p_idempotency_key => 'idem-sincupo',
      p_notes => null, p_spots => 1
    );
    perform pg_temp.assert(false, 'CUPOS. debería haber rechazado por falta de cupos');
  exception when others then
    perform pg_temp.assert(sqlerrm like 'not_available%', 'CUPOS. control de cupos intacto: rechaza sin cupos disponibles');
  end;
end $$;

-- ─── Roles: anon/authenticated no pueden ejecutar; service_role sí ─────────

set role anon;
do $$
begin
  begin
    perform public.create_reservation_atomic(
      p_class_id => '11111111-1111-1111-1111-111111111111',
      p_customer_email => 'x@example.com', p_customer_name => 'X',
      p_customer_phone => null, p_idempotency_key => 'idem-anon',
      p_notes => null, p_spots => 1
    );
    perform pg_temp.assert(false, 'ROLE-1. anon NO debería poder ejecutar create_reservation_atomic');
  exception when insufficient_privilege then
    perform pg_temp.assert(true, 'ROLE-1. anon: EXECUTE denegado en create_reservation_atomic');
  end;
end $$;
reset role;

set role authenticated;
do $$
begin
  begin
    perform public.create_reservation_atomic(
      p_class_id => '11111111-1111-1111-1111-111111111111',
      p_customer_email => 'y@example.com', p_customer_name => 'Y',
      p_customer_phone => null, p_idempotency_key => 'idem-authenticated',
      p_notes => null, p_spots => 1
    );
    perform pg_temp.assert(false, 'ROLE-2. authenticated NO debería poder ejecutar create_reservation_atomic');
  exception when insufficient_privilege then
    perform pg_temp.assert(true, 'ROLE-2. authenticated: EXECUTE denegado en create_reservation_atomic');
  end;
end $$;
reset role;

-- (clase nueva con cupo propio para no chocar con el límite de la anterior)
insert into public.classes (
  id, slug, title, date, start_time, end_time, category_event, category_label, total_spots
) values (
  '22222222-2222-2222-2222-222222222222', 'rpc-test-clase-2', 'Clase de test (RPC) 2',
  current_date + 8, '10:00', '12:00', 'adultos', 'Test', 5
);

set role service_role;
do $$
declare v_id uuid;
begin
  select reservation_id into v_id
  from public.create_reservation_atomic(
    p_class_id => '22222222-2222-2222-2222-222222222222',
    p_customer_email => 'service@example.com', p_customer_name => 'Service Role',
    p_customer_phone => '+5491123456789', p_idempotency_key => 'idem-service',
    p_notes => null, p_spots => 1,
    p_customer_phone_normalized => '5491123456789', p_whatsapp_consent => true, p_whatsapp_consent_at => null
  );
  perform pg_temp.assert(v_id is not null, 'ROLE-3. service_role SÍ puede ejecutar create_reservation_atomic (bajo SET ROLE real, firma de 10 parámetros)');
end $$;
reset role;

-- ─── Solo una sobrecarga de create_reservation_atomic ──────────────────────

do $$
declare v_count int; v_nargs int;
begin
  select count(*) into v_count from pg_proc where proname = 'create_reservation_atomic';
  perform pg_temp.assert(v_count = 1, 'OVERLOAD. existe una única función create_reservation_atomic (sin ambigüedad para PostgREST)');

  select pronargs into v_nargs from pg_proc where proname = 'create_reservation_atomic';
  perform pg_temp.assert(v_nargs = 10, 'OVERLOAD-2. la única sobrecarga tiene 10 parámetros');
end $$;

-- ─── El constraint de consistencia existe una sola vez, sin redundantes ────

do $$
declare v_count_final int; v_count_old int;
begin
  select count(*) into v_count_final from pg_constraint
  where conrelid = 'public.reservations'::regclass
    and conname = 'reservations_whatsapp_consent_consistency';
  perform pg_temp.assert(v_count_final = 1, 'CONSTRAINT-1. reservations_whatsapp_consent_consistency existe exactamente una vez');

  select count(*) into v_count_old from pg_constraint
  where conrelid = 'public.reservations'::regclass
    and conname = 'reservations_whatsapp_consent_at_requires_consent';
  perform pg_temp.assert(v_count_old = 0, 'CONSTRAINT-2. el constraint parcial viejo (de 20260710000001) no quedó rezagado');
end $$;

rollback;
