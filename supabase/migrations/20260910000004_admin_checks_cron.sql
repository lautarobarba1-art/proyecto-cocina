-- Programa el disparador horario de los chequeos proactivos al admin
-- (auditoría de automatización, fase 2 parte B): resumen diario y alerta de
-- baja ocupación.
--
-- Mismo esquema que los otros crons: pg_cron dispara cada hora, pg_net hace un
-- HTTP GET contra GET /api/cron/admin-checks, y toda la lógica (¿son las 8 AR?
-- ¿hay algo para reportar? ¿qué clases están vacías?) vive en la app. Es
-- seguro que corra de más: la deduplicación real está en notification_log.
--
-- El endpoint exige `ADMIN_CHECKS_ENABLED=true` en las env vars de Vercel;
-- hasta entonces responde 200 sin hacer nada.
--
-- Reutiliza el secreto de Vault 'cron_secret_class_reminders' (mismo valor que
-- CRON_SECRET en Vercel). Ya existe de los crons anteriores — NO hay que
-- crearlo de nuevo.

select cron.schedule(
  'admin-checks-hourly',
  '0 * * * *', -- cada hora en punto, en UTC.
  $$
  select net.http_get(
    url := 'https://www.menesteres.ar/api/cron/admin-checks',
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
--   select cron.unschedule('admin-checks-hourly');
