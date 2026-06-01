-- Permite consultas de eventos privados (formulario /contacto?tipo=eventos)
alter table public.inquiries drop constraint if exists inquiries_type_check;
alter table public.inquiries
  add constraint inquiries_type_check
  check (type in ('contact', 'espacio', 'eventos'));
