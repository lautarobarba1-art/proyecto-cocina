-- Elimina el overload antiguo de create_reservation_atomic que tiene
-- p_spots (integer) en posición 6 y p_idempotency_key (text) en posición 7.
-- La versión correcta tiene p_idempotency_key en posición 5, p_notes en 6, p_spots en 7.
-- El overload viejo causa PGRST203 ("no puedo elegir entre ambas") en la API.

drop function if exists public.create_reservation_atomic(
  uuid,   -- p_class_id
  text,   -- p_customer_name
  text,   -- p_customer_email
  text,   -- p_customer_phone
  text,   -- p_notes
  integer, -- p_spots
  text    -- p_idempotency_key
);
