-- 20260709000001_notification_log.sql dejó notification_log deliberadamente
-- sin GRANT a service_role para forzar que todo intento de notificación pase
-- por claim_notification_attempt/complete_notification_attempt (ver comentario
-- ahí). Pero lib/admin/notificaciones-queries.ts (pantalla /admin/notificaciones)
-- necesita un SELECT directo, de solo lectura, para listar el historial en el
-- panel — un caso de uso que ese diseño original no contempló y que hoy falla
-- con "permission denied for table notification_log" en cualquier stack de
-- Supabase local recién inicializado (mismo síntoma que las tablas cubiertas
-- en 20260712000002_grant_service_role_remaining_tables.sql).
--
-- Solo select (no insert/update/delete): el admin únicamente lista el
-- historial; toda escritura sigue yendo exclusivamente por las dos RPC
-- security definer ya existentes.

grant select on public.notification_log to service_role;

notify pgrst, 'reload schema';
