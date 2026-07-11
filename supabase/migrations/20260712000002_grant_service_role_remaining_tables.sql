-- Mismo problema que 20260712000001, en el resto de las tablas del proyecto:
-- inquiries, recetas y challenge_submissions tienen RLS habilitado pero
-- nunca recibieron un GRANT explícito a service_role — dependían del mismo
-- privilegio implícito que resultó no estar presente en un stack de Supabase
-- local recién inicializado (confirmado en vivo: "recetas" da 403 permission
-- denied vía service_role al abrir /recetas localmente, igual que
-- classes_with_availability antes de 20260712000001).
--
-- Se cubren acá TODAS las tablas de acceso directo (`.from("tabla")` desde
-- código server-side, sin pasar por una RPC security definer) que todavía no
-- tenían grant: notification_log queda afuera a propósito — su acceso es
-- exclusivamente vía claim_notification_attempt/complete_notification_attempt
-- (ya con EXECUTE otorgado a service_role), no vía SELECT/UPDATE directo, y
-- así se diseñó para forzar todo intento de notificación a pasar por el
-- claim atómico.
--
-- select/insert/update/delete (no `all`): cubre exactamente los verbos que
-- usa el código (CRUD desde route handlers de Next), sin otorgar TRUNCATE/
-- REFERENCES/TRIGGER que no hacen falta para una app.
--
-- Reverse-engineered a mano para esta fase (no ejecutada aún contra el
-- proyecto real). Verificar contra el schema real antes de aplicar — no es
-- destructivo si el proyecto hosteado ya tenía estos grants por otra vía.

grant select, insert, update, delete on public.inquiries to service_role;
grant select, insert, update, delete on public.recetas to service_role;
grant select, insert, update, delete on public.challenge_submissions to service_role;

notify pgrst, 'reload schema';
