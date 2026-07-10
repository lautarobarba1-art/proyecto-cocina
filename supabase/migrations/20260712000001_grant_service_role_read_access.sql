-- service_role no tenía SELECT explícito sobre classes/reservations/la vista
-- classes_with_availability en ninguna migración — el acceso siempre dependió
-- de privilegios implícitos por default. Eso funciona en el proyecto hosteado
-- (heredados de cuando se creó a mano desde el dashboard/CLI conectado al
-- proyecto), pero un stack de Supabase local recién inicializado con
-- `supabase db reset` NO los tiene: confirmado en vivo, `service_role` recibe
-- "permission denied for view classes_with_availability" (42501) contra
-- Supabase local mientras `anon` sí puede leer sin problema.
--
-- Mismo principio ya aplicado a las funciones (claim_notification_attempt,
-- complete_notification_attempt, create_reservation_atomic): no asumir
-- acceso implícito de service_role, otorgarlo explícito. Acá aplica lo mismo
-- a nivel tabla/vista, no función.
--
-- classes_with_availability tiene security_invoker=on (desde
-- 20260530000002_view_security_invoker.sql): el rol que consulta la vista
-- necesita privilegios sobre las tablas base (classes, reservations) además
-- del privilegio sobre la vista en sí — por eso se otorgan las tres.
--
-- classes y reservations necesitan más que SELECT: el panel admin hace
-- INSERT/UPDATE/DELETE directo sobre ambas sin pasar por una RPC (crear/
-- editar clase en app/api/admin/classes/**, confirmar/cancelar/borrar
-- reserva en app/api/admin/reservations/[id]/route.ts). classes_with_availability
-- es una vista de solo lectura (sin INSTEAD OF triggers) — ahí sí alcanza con
-- SELECT. La creación de reservas vía create_reservation_atomic no depende
-- de estos grants (RPC security definer, ya con su propio EXECUTE).
--
-- Reverse-engineered a mano para esta fase (no ejecutada aún contra el
-- proyecto real). Verificar contra el schema real de Supabase antes de
-- aplicar — es posible que el proyecto hosteado ya tenga estos grants por
-- otra vía y este GRANT sea un no-op ahí; no es destructivo en ningún caso.

grant select, insert, update, delete on public.classes to service_role;
grant select, insert, update, delete on public.reservations to service_role;
grant select on public.classes_with_availability to service_role;

notify pgrst, 'reload schema';
