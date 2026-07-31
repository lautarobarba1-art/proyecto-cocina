-- Programa el disparador horario de recordatorio/expiración de reservas
-- pending sin comprobante (ver plan de auditoría 2026-07-30, bugs 1d/1e).
--
-- Mismo esquema que 20260717000001_class_reminders_cron.sql: pg_cron dispara
-- cada hora, pg_net llama por HTTP a GET /api/cron/payment-deadline, y toda
-- la lógica de negocio (ventana de 23-25hs para el recordatorio, corte de
-- 48hs para la expiración, deduplicación) vive en la app — este job es solo
-- el "despertador".
--
-- IMPORTANTE — paso manual OBLIGATORIO antes (o después) de aplicar esta
-- migración, ejecutado UNA VEZ a mano en el SQL Editor del dashboard (NUNCA
-- en una migración versionada, para no commitear el secreto). Si ya existe
-- el secreto 'cron_secret_class_reminders' (mismo valor que CRON_SECRET), se
-- reutiliza el mismo — no hace falta crear uno nuevo:
--
--   select vault.create_secret(
--     '<el mismo valor que CRON_SECRET en las env vars de Vercel>',
--     'cron_secret_class_reminders',
--     'Secreto compartido con los endpoints de cron'
--   );

select cron.schedule(
  'payment-deadline-hourly',
  '0 * * * *', -- cada hora en punto, en UTC.
  $$
  select net.http_get(
    url := 'https://www.menesteres.ar/api/cron/payment-deadline',
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
--   select cron.unschedule('payment-deadline-hourly');
