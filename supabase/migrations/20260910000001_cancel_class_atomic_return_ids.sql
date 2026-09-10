-- Agrega `reservation_id` a lo que devuelve `cancel_class_atomic`, para que el
-- route handler (app/api/admin/classes/[id]/cancel/route.ts) pueda rutear el
-- aviso de cancelación de cada cliente por el pipeline de notificaciones
-- (claim/complete necesita el id de la reserva para armar la dedup key).
--
-- Hay que DROP + CREATE (no CREATE OR REPLACE): agregar una columna a
-- RETURNS TABLE cambia el tipo de retorno de la función, y Postgres no lo
-- permite con CREATE OR REPLACE. La lógica interna queda idéntica a
-- 20260530000001_cancel_class_atomic.sql — solo cambia el RETURNS TABLE y el
-- RETURNING.

drop function if exists public.cancel_class_atomic(uuid);

create function public.cancel_class_atomic(
  p_class_id uuid
)
returns table (
  reservation_id   uuid,
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

  -- ── Cancelar reservas y retornar datos de clientes para los avisos ──────────
  return query
    update public.reservations
    set
      status       = 'cancelled',
      cancelled_at = now()
    where
      class_id = p_class_id
      and status in ('pending', 'confirmed')
    returning
      reservations.id,
      reservations.customer_name,
      reservations.customer_email,
      v_class.title,
      v_class.date::text,
      v_class.start_time::text;

end;
$$;

-- Mismas restricciones que la versión original, más un grant explícito a
-- service_role (la versión vieja dependía de un privilegio implícito — mismo
-- criterio que las RPC de notification_log).
revoke all on function public.cancel_class_atomic(uuid)
  from public, anon, authenticated;
grant execute on function public.cancel_class_atomic(uuid) to service_role;
