-- Consultas de contacto y alquiler del espacio
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('contact', 'espacio')),
  customer_name text not null,
  customer_email text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'new' check (status in ('new', 'read', 'archived')),
  created_at timestamptz not null default now()
);

create index if not exists inquiries_created_at_idx on public.inquiries (created_at desc);
create index if not exists inquiries_type_idx on public.inquiries (type);

alter table public.inquiries enable row level security;

-- Sin políticas para anon/authenticated: solo service role (API server) inserta y lee.
