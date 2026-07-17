-- classes.deposit_amount: columna que el código ya usaba en todos lados
-- (formulario admin de clases, validación y email de confirmación de
-- reserva — lib/admin/clases-validation.ts, app/api/admin/classes/**,
-- app/api/reservations/route.ts, lib/calendar/adapters.ts) pero que ninguna
-- migración del repo llegó a crear — discrepancia ya señalada en la
-- auditoría original ("verificar contra el schema real de Supabase"). Salió
-- a la luz recién ahora al crear una clase de prueba en un Postgres local
-- limpio: `select ... deposit_amount` fallaba silenciosamente (el error de
-- Postgres no se estaba chequeando en app/api/reservations/route.ts, así que
-- el request no se rompía, pero el email quedaba sin el monto de
-- seña).
--
-- Nullable (no todas las clases tienen seña) y con el mismo tipo/precisión
-- que `price` (numeric(10,2)), mismo check >= 0 que ya aplica la validación
-- en TypeScript (lib/admin/clases-validation.ts).
--
-- Reverse-engineered a mano para esta fase (no ejecutada aún contra el
-- proyecto real). Es muy probable que el proyecto hosteado YA tenga esta
-- columna agregada a mano (fuera de las migraciones) — verificar el schema
-- real antes de aplicar; si ya existe con este mismo tipo, este ALTER es
-- prácticamente un no-op gracias al `if not exists` y al `drop constraint if
-- exists` previo.

alter table public.classes
  add column if not exists deposit_amount numeric(10, 2);

alter table public.classes
  drop constraint if exists classes_deposit_amount_check;

alter table public.classes
  add constraint classes_deposit_amount_check
    check (deposit_amount is null or deposit_amount >= 0);
