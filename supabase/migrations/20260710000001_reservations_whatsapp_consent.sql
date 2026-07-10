-- Consentimiento explícito para notificaciones transaccionales por WhatsApp.
-- Reverse-engineered a mano para esta fase (no ejecutada aún contra el proyecto real).
-- Verificar contra el schema real de Supabase antes de aplicar.
-- Requiere: 20260519000002_reservations.sql
--
-- Deliberadamente separado de la migración de notification_log
-- (20260709000001), que ya está cerrada: esto es un cambio de schema
-- distinto (columnas en `reservations`, no en `notification_log`).
--
-- "Tener teléfono" NO equivale a consentimiento: el teléfono es un dato de
-- contacto que ya existía antes; el consentimiento es una decisión explícita
-- y separada del cliente al momento de reservar (checkbox sin marcar por
-- defecto, texto específico de WhatsApp — ver
-- components/clases/ClassReservationForm.tsx). Reservas históricas (creadas
-- antes de que existiera este checkbox) quedan con whatsapp_consent=false
-- por el default de la columna: se tratan como "sin consentimiento", nunca
-- se les envía WhatsApp, pero el email de confirmación sigue funcionando
-- exactamente igual que siempre.
--
-- ALCANCE DE ESTA MIGRACIÓN: únicamente agrega las dos columnas de abajo.
-- Deliberadamente NO agrega acá ningún constraint de consistencia — la
-- regla completa depende también de `customer_phone_normalized`
-- (consentimiento verdadero exige un teléfono normalizado no vacío), y esa
-- columna todavía no existe en este punto de la secuencia de migraciones.
-- Agregar un constraint parcial acá (solo whatsapp_consent/whatsapp_consent_at,
-- sin considerar el teléfono) daría una falsa sensación de consistencia y
-- habría que reemplazarlo enseguida en la siguiente migración — mejor no
-- afirmar acá una garantía que esta migración por sí sola no cumple. El
-- constraint definitivo y completo se agrega en
-- 20260711000001_create_reservation_atomic_whatsapp_fields.sql, junto con
-- `customer_phone_normalized`.

alter table public.reservations
  add column if not exists whatsapp_consent boolean not null default false,
  add column if not exists whatsapp_consent_at timestamptz;
