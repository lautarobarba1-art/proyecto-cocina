-- Tabla de clases del estudio
-- Reverse-engineered desde el código de la aplicación.
-- Verificar contra el schema real de Supabase antes de correr en un entorno nuevo.

create table if not exists public.classes (
  id              uuid primary key default gen_random_uuid(),

  -- Identificación
  slug            text not null,
  title           text not null,

  -- Fecha y horario
  date            date not null,
  start_time      time not null,
  end_time        time not null,

  -- Categorización
  category_event  text not null check (category_event in ('adultos', 'ninos', 'eventos')),
  category_label  text not null,  -- label visible al público (ej: "Cocina italiana")

  -- Contenido
  short_desc      text not null default '',
  description_long text not null default '',
  duration_label  text not null default '',  -- ej: "2 horas 30 min"

  -- Imagen
  image_src       text not null default '',
  image_alt       text not null default '',

  -- Cupos y precio
  total_spots     integer not null check (total_spots >= 1 and total_spots <= 100),
  price           numeric(10, 2) not null default 0 check (price >= 0),
  payment_link    text,

  -- Flags
  is_highlighted  boolean not null default false,
  is_cancelled    boolean not null default false,

  -- Timestamps
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- Una misma clase (slug) puede darse en múltiples fechas; el par slug+date es único.
  unique (slug, date)
);

create index if not exists classes_date_idx        on public.classes (date);
create index if not exists classes_slug_idx        on public.classes (slug);
create index if not exists classes_is_cancelled_idx on public.classes (is_cancelled);

-- Actualiza updated_at automáticamente
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists classes_set_updated_at on public.classes;
create trigger classes_set_updated_at
  before update on public.classes
  for each row execute function public.set_updated_at();

alter table public.classes enable row level security;

-- Solo service role lee y escribe (API Next.js).
-- El sitio público accede vía service role desde route handlers; no hay acceso anon directo.
