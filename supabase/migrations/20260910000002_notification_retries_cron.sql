-- Programa el disparador horario del worker de reintentos de notificaciones
-- (auditoría de automatización, fase 2 parte A).
--
-- Mismo esquema que 20260717000001_class_reminders_cron.sql y
-- 20260731000003_payment_deadline_cron.sql: pg_cron dispara cada hora, pg_net
-- hace un HTTP GET contra GET /api/cron/notification-retries, y toda la lógica
-- (qué filas de notification_log reintentar, backoff, deduplicación) vive en la
-- app. Es seguro que corra de más o se superponga: la deduplicación real está
-- en notification_log / claim_notification_attempt.
--
-- El endpoint exige `NOTIFICATION_RETRIES_ENABLED=true` en las env vars de
-- Vercel; hasta entonces responde 200 sin hacer nada.
--
-- Reutiliza el secreto de Vault 'cron_secret_class_reminders' (mismo valor que
-- CRON_SECRET en Vercel). Ya existe de los crons anteriores — NO hay que
-- crearlo de nuevo.

select cron.schedule(
  'notification-retries-hourly',
  '0 * * * *', -- cada hora en punto, en UTC.
  $$
  select net.http_get(
    url := 'https://www.menesteres.ar/api/cron/notification-retries',
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
--   select cron.unschedule('notification-retries-hourly');
