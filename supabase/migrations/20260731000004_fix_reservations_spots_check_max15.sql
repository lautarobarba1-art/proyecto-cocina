-- El constraint quedó en máx. 10 cupos (20260703000001) pero el form
-- (ClassReservationForm.tsx) y la API (app/api/reservations/route.ts) ya
-- ofrecen/validan hasta 15. Una reserva de 11-15 cupos pasaba la validación
-- de la API y fallaba recién al insertar, con un 500 genérico.

alter table public.reservations
  drop constraint if exists reservations_spots_check;

alter table public.reservations
  add constraint reservations_spots_check check (spots >= 1 and spots <= 15);
