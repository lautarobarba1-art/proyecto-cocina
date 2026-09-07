-- Agrega los tipos de evento para los dos avisos nuevos a la administradora
-- (auditoría de automatización, fase 1):
--   reserva_nueva_admin  -> aviso a la admin cuando un cliente crea una reserva
--                           (hasta ahora, la admin recién se enteraba cuando
--                           subían un comprobante — podía haber reservas
--                           `pending` invisibles para ella indefinidamente).
--   consulta_nueva_admin -> aviso a la admin cuando llega una consulta
--                           (contacto, evento privado o alquiler del espacio).
--                           Hasta ahora `POST /api/inquiries` no disparaba
--                           ningún email: la única forma de enterarse era
--                           entrar al panel a revisar.
--
-- Mismo patrón que 20260731000002_notification_log_payment_deadline_events.sql:
-- el DROP busca el constraint de event_type por definición real (no por
-- nombre asumido) para no dejar dos checks conviviendo si el nombre real
-- difiere de la convención.

do $$
declare
  con record;
begin
  for con in
    select conname
    from pg_constraint
    where conrelid = 'public.notification_log'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%event_type%'
  loop
    execute format('alter table public.notification_log drop constraint %I', con.conname);
  end loop;
end $$;

alter table public.notification_log
  add constraint notification_log_event_type_check
    check (event_type in (
      'reserva_confirmada',
      'pago_confirmado',
      'recordatorio',
      'cancelacion',
      'reprogramacion',
      'comprobante_subido',
      'recordatorio_comprobante',
      'reserva_nueva_admin',
      'consulta_nueva_admin'
    ));
