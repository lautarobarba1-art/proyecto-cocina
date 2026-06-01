-- Función atómica para cancelar una clase.
--
-- Reemplaza el flujo de dos queries separadas en el route handler, que podía
-- dejar la clase cancelada pero las reservas activas si el segundo UPDATE fallaba.
--
-- Esta función:
--   1. Lockea la fila de la clase (FOR UPDATE) para evitar cancelaciones concurrentes.
--   2. Marca classes.is_cancelled = true.
--   3. Cancela TODAS las reservas pending/confirmed de esa clase.
--   4. Retorna los datos de los clientes afectados para que el route handler
--      envíe los emails de notificación FUERA de la transacción.
--
-- Todo ocurre en una sola transacción de base de datos.

create or replace function public.cancel_class_atomic(
  p_class_id uuid
)
returns table (
  customer_name    text,
  customer_email   text,
  class_title      text,
  class_date       text,
  class_start_time text
)
language plpgsql
security definer
as $$
declare
  v_class public.classes%rowtype;
begin

  -- ── Leer y bloquear la clase ────────────────────────────────────────────────
  select * into v_class
  from public.classes
  where id = p_class_id
  for update;

  if not found then
    raise exception 'not_found: class does not exist';
  end if;

  if v_class.is_cancelled then
    raise exception 'already_cancelled: class is already cancelled';
  end if;

  -- ── Marcar la clase como cancelada ──────────────────────────────────────────
  update public.classes
  set
    is_cancelled = true,
    updated_at   = now()
  where id = p_class_id;

  -- ── Cancelar reservas y retornar datos de clientes para emails ──────────────
  -- Si no hay reservas activas, la función retorna 0 filas (sin error).
  return query
    update public.reservations
    set
      status       = 'cancelled',
      cancelled_at = now()
    where
      class_id = p_class_id
      and status in ('pending', 'confirmed')
    returning
      reservations.customer_name,
      reservations.customer_email,
      v_class.title,
      v_class.date::text,
      v_class.start_time::text;

end;
$$;

-- Restringir ejecución al service role únicamente.
revoke all on function public.cancel_class_atomic(uuid)
  from public, anon, authenticated;
