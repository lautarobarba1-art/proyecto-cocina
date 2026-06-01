-- Aplica security_invoker a la vista classes_with_availability.
--
-- Por defecto PostgreSQL crea las vistas con semántica "security definer":
-- se ejecutan con los permisos del dueño de la vista (superuser), lo que
-- puede bypassear las políticas RLS de las tablas subyacentes.
--
-- Con security_invoker = on, la vista corre con los permisos del CALLER,
-- respetando el RLS de `classes` y `reservations` según el rol que consulte.
-- El service role (usado por la API de Next.js) sigue bypasando RLS como
-- siempre; el cambio solo afecta a roles anon/authenticated que jamás
-- deberían ver esta vista directamente.

create or replace view public.classes_with_availability
  with (security_invoker = on)
as
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
