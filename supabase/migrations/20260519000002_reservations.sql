-- Reservas, vista de disponibilidad y función atómica de reserva
-- Reverse-engineered desde el código de la aplicación.
-- Verificar contra el schema real de Supabase antes de correr en un entorno nuevo.
-- Requiere: 20260519000001_classes.sql

-- ─── Tabla reservations ────────────────────────────────────────────────────────

create table if not exists public.reservations (
  id                uuid primary key default gen_random_uuid(),

  -- Relación con clase
  class_id          uuid not null references public.classes(id) on delete restrict,

  -- Datos del cliente
  customer_name     text not null,
  customer_email    text not null,
  customer_phone    text,
  notes             text,

  -- Reserva
  spots             integer not null default 1 check (spots >= 1),
  status            text not null default 'pending'
                      check (status in ('pending', 'confirmed', 'cancelled')),

  -- Deduplicación: el form genera un UUID por sesión de reserva.
  -- Si el mismo key ya existe, la RPC devuelve la reserva existente sin duplicar.
  idempotency_key   text unique,

  -- Timestamps de estado
  created_at        timestamptz not null default now(),
  confirmed_at      timestamptz,
  cancelled_at      timestamptz
);

create index if not exists reservations_class_id_idx    on public.reservations (class_id);
create index if not exists reservations_status_idx      on public.reservations (status);
create index if not exists reservations_created_at_idx  on public.reservations (created_at desc);
create index if not exists reservations_email_idx       on public.reservations (customer_email);

alter table public.reservations enable row level security;

-- Solo service role opera esta tabla.


-- ─── Vista classes_with_availability ──────────────────────────────────────────
-- Extiende `classes` con `spots_left` calculado en tiempo real.

create or replace view public.classes_with_availability as
select
  c.*,
  greatest(
    0,
    c.total_spots - coalesce(
      (
        select sum(r.spots)
        from public.reservations r
        where r.class_id = c.id
          and r.status in ('pending', 'confirmed')
      ),
      0
    )
  )::integer as spots_left
from public.classes c;


-- ─── RPC create_reservation_atomic ────────────────────────────────────────────
-- Crea una reserva de forma transaccional:
--   1. Verifica que la clase exista, no esté cancelada y tenga cupos.
--   2. Maneja idempotencia: si el key ya existe devuelve la reserva existente.
--   3. Inserta la reserva y devuelve el resultado.
--
-- Errores: lanza EXCEPTION cuyo message contiene 'not_available' o 'duplicate'.

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

  -- ── Idempotencia ────────────────────────────────────────────────────────────
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

  -- ── Leer y bloquear la clase ────────────────────────────────────────────────
  select * into v_class
  from public.classes
  where id = p_class_id
  for update;

  if not found then
    raise exception 'not_available: class not found';
  end if;

  if v_class.is_cancelled then
    raise exception 'not_available: class is cancelled';
  end if;

  -- ── Verificar cupos ─────────────────────────────────────────────────────────
  select coalesce(sum(spots), 0) into v_spots_taken
  from public.reservations
  where class_id = p_class_id
    and status in ('pending', 'confirmed');

  if (v_class.total_spots - v_spots_taken) < p_spots then
    raise exception 'not_available: not enough spots';
  end if;

  -- ── Verificar reserva duplicada (mismo email + clase activa, sin idempotency key) ──
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

  -- ── Insertar ────────────────────────────────────────────────────────────────
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

-- Solo ejecutable desde service role (ya implícito por security definer + sin grant a anon/authenticated).
revoke all on function public.create_reservation_atomic(uuid, text, text, text, text, text, integer)
  from public, anon, authenticated;
