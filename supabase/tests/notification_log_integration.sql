-- Smoke test manual de la infraestructura de idempotencia del canal email.
-- Ejecutar contra Supabase local; el ROLLBACK final no deja datos.

begin;

do $$
declare
  v_claim record;
  v_duplicate record;
  v_completed boolean;
begin
  select * into v_claim
  from public.claim_notification_attempt(
    'email',
    'reserva_confirmada:00000000-0000-0000-0000-000000000001',
    'reserva_confirmada',
    'test@example.com',
    null,
    null,
    'reserva_confirmacion',
    '{"customerName":"Test"}'::jsonb,
    'live',
    5,
    10
  );

  if not v_claim.claimed or v_claim.claim_token is null then
    raise exception 'el primer intento de email debe obtener el claim';
  end if;

  select public.complete_notification_attempt(
    v_claim.id,
    v_claim.claim_token,
    'sent',
    null,
    null,
    null,
    null,
    null
  ) into v_completed;

  if not v_completed then
    raise exception 'el claim vigente debe poder completarse';
  end if;

  select * into v_duplicate
  from public.claim_notification_attempt(
    'email',
    'reserva_confirmada:00000000-0000-0000-0000-000000000001',
    'reserva_confirmada',
    'test@example.com',
    null,
    null,
    'reserva_confirmacion',
    '{}'::jsonb,
    'live',
    5,
    10
  );

  if v_duplicate.claimed then
    raise exception 'un email ya enviado no debe reclamarse otra vez';
  end if;
end;
$$;

rollback;
