-- Agrega los tipos de evento de la fase 2 parte B:
--   resumen_admin   -> resumen diario al admin (8:00 hora Argentina)
--   baja_ocupacion  -> aviso al admin de una clase próxima (4 días) con pocas reservas
--
-- Mismo patrón que 20260731000002 / 20260907000001: el DROP busca el
-- constraint de event_type por definición real (no por nombre asumido) para
-- no dejar dos checks conviviendo si el nombre real difiere de la convención.

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
      'consulta_nueva_admin',
      'resumen_admin',
      'baja_ocupacion'
    ));
