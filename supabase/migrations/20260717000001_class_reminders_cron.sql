-- Programa el disparador horario de recordatorios de clase.
--
-- Arquitectura elegida: pg_cron (ya habilitado en el proyecto) dispara una
-- vez por hora, y pg_net hace un HTTP GET contra el endpoint real de la app
-- (GET /api/cron/class-reminders), que ya vive en Next.js. Toda la lógica de
-- negocio (ventana horaria, deduplicación, envío por Resend) sigue en el
-- código de la app — este job es solo el "despertador", no reimplementa nada
-- en SQL. Se eligió por sobre Vercel Cron porque el proyecto está en plan
-- Free de Vercel, que solo permite 1 ejecución diaria e imprecisa; con este
-- esquema la cadencia horaria no depende del plan de Vercel.
--
-- Es seguro que este job corra de más, se superponga con otra ejecución, o
-- que Supabase reintente la llamada HTTP: toda la deduplicación real vive en
-- notification_log (ver claim_notification_attempt), no acá.
--
-- IMPORTANTE — paso manual OBLIGATORIO antes (o después) de aplicar esta
-- migración, ejecutado UNA VEZ a mano en el SQL Editor del dashboard (NUNCA
-- en una migración versionada, para no commitear el secreto):
--
--   select vault.create_secret(
--     '<el mismo valor que CRON_SECRET en las env vars de Vercel>',
--     'cron_secret_class_reminders',
--     'Secreto compartido con GET /api/cron/class-reminders'
--   );
--
-- Si ese secreto no existe todavía, este job va a fallar en el paso de
-- armar el header Authorization (el endpoint entonces responderá 401 y el
-- job seguirá reintentando cada hora sin efecto, sin romper nada).

select cron.schedule(
  'class-reminders-hourly',
  '0 * * * *', -- cada hora en punto, en UTC (el timezone de pg_cron no
               -- afecta la corrección: la ventana real de ~24hs la calcula
               -- la app con la hora real de ejecución, no con el cron).
  $$
  select net.http_get(
    url := 'https://menesteres.ar/api/cron/class-reminders',
    headers := jsonb_build_object(
      'Authorization',
      'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'cron_secret_class_reminders'
      )
    ),
    timeout_milliseconds := 20000
  );
  $$
);

-- Para desactivar el disparador sin revertir la migración completa:
--   select cron.unschedule('class-reminders-hourly');
