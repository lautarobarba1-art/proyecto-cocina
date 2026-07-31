-- Agrega los tipos de evento nuevos para la cadena de "falta de comprobante":
--   comprobante_subido        -> aviso a la admin cuando el cliente sube un comprobante
--   recordatorio_comprobante  -> aviso al cliente ~24hs después de reservar si sigue
--                                 pending sin comprobante subido
-- (la cancelación por falta de comprobante a las 48hs reutiliza el evento
-- 'cancelacion' ya existente — sigue siendo, semánticamente, una cancelación).
--
-- El DROP no asume el nombre auto-generado del constraint original
-- ('notification_log_event_type_check', que es lo que Postgres pone por
-- convención para un check inline sin nombre) — lo busca por definición real
-- en pg_constraint. Si por lo que sea el nombre real difiere de esa
-- convención, `drop constraint if exists notification_log_event_type_check`
-- no rompería, pero tampoco borraría el constraint viejo: quedarían DOS
-- checks sobre event_type (el viejo, de 5 valores, y el nuevo, de 7), y como
-- ambos deben cumplirse a la vez, los 2 eventos nuevos seguirían rechazados.
-- Este bloque evita depender de esa suposición.

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
      'recordatorio_comprobante'
    ));
