-- Impide reservas para clases con fecha pasada.
-- Complementa los filtros en queries/UI; última línea de defensa en DB.

create or replace function public.create_reservation_atomic(
  p_class_id        uuid,
  p_customer_email  text,
  p_customer_name   text,
  p_customer_phone  text,
  p_idempotency_key text,
  p_notes           text,
  p_spots           integer
)
returns table (
  reservation_id  uuid,
  was_created     boolean,
  error_code      text
)
language plpgsql
security definer
as $$
declare
  v_class         public.classes%rowtype;
  v_spots_taken   integer;
  v_existing_id   uuid;
  v_new_id        uuid;
begin

  if p_idempotency_key is not null then
    select id into v_existing_id
    from public.reservations
    where idempotency_key = p_idempotency_key
    limit 1;

    if v_existing_id is not null then
      return query select v_existing_id, false, null::text;
      return;
    end if;
  end if;

  select * into v_class
  from public.classes
  where id = p_class_id
  for update;

  if not found then
    raise exception 'not_available: class not found';
  end if;

  if v_class.is_cancelled then
    raise exception 'cancelled: class is cancelled';
  end if;

  if v_class.date < current_date then
    raise exception 'not_available: class date has passed';
  end if;

  select coalesce(sum(spots), 0) into v_spots_taken
  from public.reservations
  where class_id = p_class_id
    and status in ('pending', 'confirmed');

  if (v_class.total_spots - v_spots_taken) < p_spots then
    raise exception 'not_available: not enough spots';
  end if;

  if p_idempotency_key is null then
    if exists (
      select 1 from public.reservations
      where class_id = p_class_id
        and customer_email = p_customer_email
        and status in ('pending', 'confirmed')
    ) then
      raise exception 'duplicate: reservation already exists for this email and class';
    end if;
  end if;

  insert into public.reservations (
    class_id,
    customer_name,
    customer_email,
    customer_phone,
    notes,
    spots,
    status,
    idempotency_key
  ) values (
    p_class_id,
    p_customer_name,
    p_customer_email,
    p_customer_phone,
    p_notes,
    p_spots,
    'pending',
    p_idempotency_key
  )
  returning id into v_new_id;

  return query select v_new_id, true, null::text;

end;
$$;

revoke all on function public.create_reservation_atomic(uuid, text, text, text, text, text, integer)
  from public, anon, authenticated;
