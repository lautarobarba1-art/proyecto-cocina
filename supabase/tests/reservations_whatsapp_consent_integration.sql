-- Prueba de integración manual de las columnas de consentimiento de WhatsApp
-- y del constraint de consistencia definitivo en `reservations`
-- (columnas: 20260710000001_reservations_whatsapp_consent.sql;
--  constraint completo: 20260711000001_create_reservation_atomic_whatsapp_fields.sql,
--  que agrega customer_phone_normalized y reemplaza el constraint parcial
--  de la primera migración por reservations_whatsapp_consent_consistency).
--
-- NO es parte de las migraciones. Requiere que
-- 20260519000001_classes.sql, 20260519000002_reservations.sql,
-- 20260710000001_reservations_whatsapp_consent.sql y
-- 20260711000001_create_reservation_atomic_whatsapp_fields.sql (las CUATRO,
-- en ese orden) ya estén aplicadas. Corre dentro de una transacción que
-- termina en ROLLBACK — no deja datos de prueba. NUNCA correr contra
-- producción.

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
  '11111111-1111-1111-1111-111111111111', 'consent-test-clase', 'Clase de test (consent)',
  current_date + 7, '10:00', '12:00', 'adultos', 'Test', 20
);

-- ─── Combinaciones que DEBEN funcionar (escritura directa) ─────────────────

do $$
declare v_id uuid;
begin
  -- consent=false, consent_at=NULL, normalized_phone=NULL
  insert into public.reservations (
    class_id, customer_name, customer_email, customer_phone, spots, status
  ) values (
    '11111111-1111-1111-1111-111111111111', 'Cliente Histórico', 'historico@example.com', null, 1, 'pending'
  ) returning id into v_id;
  perform pg_temp.assert(v_id is not null, 'OK-1. consent=false + consent_at=NULL + normalized_phone=NULL: acepta (reserva histórica típica)');
end $$;

do $$
declare v_id uuid;
begin
  -- consent=false, consent_at=NULL, normalized_phone válido (teléfono como
  -- dato de contacto general, sin autorizar WhatsApp)
  insert into public.reservations (
    class_id, customer_name, customer_email, customer_phone, customer_phone_normalized, spots, status
  ) values (
    '11111111-1111-1111-1111-111111111111', 'Cliente Sin Consentir', 'sinconsentir@example.com',
    '11 2345 6789', '5491123456789', 1, 'pending'
  ) returning id into v_id;
  perform pg_temp.assert(v_id is not null, 'OK-2. consent=false + normalized_phone válido: acepta (teléfono como dato de contacto sin autorizar WhatsApp)');
end $$;

do $$
declare v_id uuid;
begin
  -- consent=true, consent_at presente, normalized_phone válido
  insert into public.reservations (
    class_id, customer_name, customer_email, customer_phone, customer_phone_normalized, spots, status,
    whatsapp_consent, whatsapp_consent_at
  ) values (
    '11111111-1111-1111-1111-111111111111', 'Cliente Consintió', 'consintio@example.com',
    '+5491123456789', '5491123456789', 1, 'pending', true, now()
  ) returning id into v_id;
  perform pg_temp.assert(v_id is not null, 'OK-3. consent=true + consent_at presente + normalized_phone válido: acepta');
end $$;

-- ─── Combinaciones que DEBEN fallar (escritura directa) ─────────────────────

do $$
begin
  begin
    insert into public.reservations (
      class_id, customer_name, customer_email, customer_phone_normalized, spots, status,
      whatsapp_consent, whatsapp_consent_at
    ) values (
      '11111111-1111-1111-1111-111111111111', 'X', 'x1@example.com', '5491123456789', 1, 'pending', true, null
    );
    perform pg_temp.assert(false, 'FAIL-1. debería rechazar consent=true + consent_at=NULL');
  exception when check_violation then
    perform pg_temp.assert(true, 'FAIL-1. consent=true + consent_at=NULL: rechazado (check_violation)');
  end;
end $$;

do $$
begin
  begin
    insert into public.reservations (
      class_id, customer_name, customer_email, customer_phone_normalized, spots, status,
      whatsapp_consent, whatsapp_consent_at
    ) values (
      '11111111-1111-1111-1111-111111111111', 'X', 'x2@example.com', null, 1, 'pending', true, now()
    );
    perform pg_temp.assert(false, 'FAIL-2. debería rechazar consent=true + normalized_phone=NULL');
  exception when check_violation then
    perform pg_temp.assert(true, 'FAIL-2. consent=true + normalized_phone=NULL: rechazado (check_violation)');
  end;
end $$;

do $$
begin
  begin
    insert into public.reservations (
      class_id, customer_name, customer_email, customer_phone_normalized, spots, status,
      whatsapp_consent, whatsapp_consent_at
    ) values (
      '11111111-1111-1111-1111-111111111111', 'X', 'x3@example.com', '', 1, 'pending', true, now()
    );
    perform pg_temp.assert(false, 'FAIL-3. debería rechazar consent=true + normalized_phone=vacío');
  exception when check_violation then
    perform pg_temp.assert(true, 'FAIL-3. consent=true + normalized_phone='''': rechazado (check_violation)');
  end;
end $$;

do $$
begin
  begin
    insert into public.reservations (
      class_id, customer_name, customer_email, customer_phone_normalized, spots, status,
      whatsapp_consent, whatsapp_consent_at
    ) values (
      '11111111-1111-1111-1111-111111111111', 'X', 'x4@example.com', '   ', 1, 'pending', true, now()
    );
    perform pg_temp.assert(false, 'FAIL-4. debería rechazar consent=true + normalized_phone solo espacios');
  exception when check_violation then
    perform pg_temp.assert(true, 'FAIL-4. consent=true + normalized_phone=''   '': rechazado (check_violation)');
  end;
end $$;

do $$
begin
  begin
    insert into public.reservations (
      class_id, customer_name, customer_email, customer_phone_normalized, spots, status,
      whatsapp_consent, whatsapp_consent_at
    ) values (
      '11111111-1111-1111-1111-111111111111', 'X', 'x5@example.com', '5491123456789', 1, 'pending', false, now()
    );
    perform pg_temp.assert(false, 'FAIL-5. debería rechazar consent=false + consent_at presente');
  exception when check_violation then
    perform pg_temp.assert(true, 'FAIL-5. consent=false + consent_at presente: rechazado (check_violation)');
  end;
end $$;

-- ─── Compatibilidad histórica: no romper reservas existentes sin teléfono ──

do $$
declare v_id uuid;
begin
  insert into public.reservations (
    class_id, customer_name, customer_email, customer_phone, spots, status
  ) values (
    '11111111-1111-1111-1111-111111111111', 'Cliente Sin Telefono', 'sintelefono@example.com', null, 1, 'pending'
  ) returning id into v_id;
  perform pg_temp.assert(v_id is not null, 'HIST. reserva sin teléfono ni consentimiento se sigue creando sin problema');
end $$;

rollback;
