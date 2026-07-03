-- El constraint reservations_spots_check quedó desactualizado en máx. 4 cupos
-- (heredado del <select> original del formulario). El formulario y la API
-- (app/api/reservations/route.ts) ya validan hasta 10 cupos por reserva,
-- pero el insert seguía siendo rechazado por este constraint para spots >= 5.

alter table public.reservations
  drop constraint if exists reservations_spots_check;

alter table public.reservations
  add constraint reservations_spots_check check (spots >= 1 and spots <= 10);
