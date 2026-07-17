# Notificaciones transaccionales por WhatsApp

Documento vivo. Describe únicamente el módulo de notificaciones multi-canal
(email + WhatsApp) asociado al sistema de reservas de clases. No documenta el
resto del proyecto.

Última verificación contra el repositorio real: **2026-07-11**, contrastado
archivo por archivo (código, migraciones, tests, `.env.local`, `git log`,
estado real de la base local vía `docker exec ... psql`), no contra memoria
de conversaciones anteriores.

---

## 1. Propósito y alcance

Agregar WhatsApp (WhatsApp Business Platform / Cloud API oficial, sin
automatización de WhatsApp Web ni chatbot) como canal adicional a los emails
transaccionales ya existentes (Resend), para dos eventos de negocio:

1. Confirmación de reserva.
2. Confirmación de pago (cuando la administradora marca una reserva como
   `confirmed`).

Explícitamente **no** implementa (ver [§19](#19-fuera-de-alcance-actual)):
recordatorios, cron, cancelaciones, reprogramaciones, webhook de estado de
entrega, ni panel administrativo de historial de notificaciones.

---

## 2. Estado actual (resumen ejecutivo)

| Componente | Estado |
|---|---|
| Código del dispatcher, cliente WhatsApp, normalización de teléfono, consentimiento | **Implementado**, en el repositorio |
| Tests unitarios (96 tests, 11 archivos) | **Pasan localmente** (`node --test`) |
| Estado en `origin/main` / GitHub | **El módulo NO está en `origin/main`.** El 2026-07-10/11 se hizo `git revert` de `c49f9c4` (todo el módulo) y de `0d15db0` (fix + grants) y se pusheó — esto fue para que `main` coincida con lo que corría en producción tras el rollback. `origin/main` hoy no tiene ningún archivo de `lib/whatsapp/`, `lib/notifications/` ni las migraciones de este módulo |
| Estado en `main` **local** (esta máquina) | El 2026-07-11 se revirtieron esos dos reverts (`git revert` sobre `2cecba4` y `5f21ae5`) para retomar pruebas ahora que Meta aprobó una plantilla. El código y las 6 migraciones están de nuevo presentes en el working tree y en el historial de `main` local — **pero todavía no se pusheó**. `main` local está 2 commits adelante de `origin/main` |
| Migraciones de grants (`service_role`) y `classes.deposit_amount` | Sin commitear al momento del incidente; luego committeadas (`0d15db0`), revertidas junto con el resto, y vueltas a aplicar por el segundo revert. Contenido sin cambios respecto a la versión anterior de este documento |
| Aplicación contra Supabase **local** (CLI) | **Aplicado y verificado en la base real corriendo** (`docker exec ... psql`, 2026-07-11): existen `notification_log`, `reservations.customer_phone_normalized`, `reservations.whatsapp_consent`, `classes.deposit_amount`, y los `GRANT` de `service_role` sobre `classes`/`reservations`/`recetas`/`challenge_submissions`. El reset de git no afectó el estado de esta base — los `git revert` son operaciones sobre el historial, no sobre la base local, que conserva su propio estado entre sesiones |
| Aplicación contra Supabase **de producción real** (`rfpsqlqaqcwjzskkgril.supabase.co`) | **NO aplicado.** Ninguna de las 6 migraciones nuevas corrió nunca contra la base real |
| Deploy en Vercel (producción, `menesteres.ar`) | Sirve el build previo a este módulo desde el rollback ("Promote to Production"). Como `origin/main` ya no contiene el código de WhatsApp, un futuro push normal a `main` **ya no reintroduce el bug** — ese riesgo quedó resuelto por los reverts pusheados. Un push del estado local actual (con el módulo restaurado) sí volvería a introducirlo si se hace sin aplicar antes las migraciones a producción (ver [§21](#21-orden-seguro-de-despliegue)) |
| `WHATSAPP_ENABLED` en producción | Desconocido/no confirmado explícitamente. Irrelevante mientras el módulo no esté ni en `origin/main` ni desplegado |
| Prueba real de envío (Meta test number) | **Exitosa (2026-07-11).** Reserva de prueba real vía `POST /api/reservations` contra Supabase local, número de destinatario verificado en Meta. `notification_log`: `whatsapp` → `status: sent`, con `provider_message_id` real (`wamid...`) devuelto por la Graph API. `email` → `status: sent` también. En el primer intento falló con error de Meta `131030` ("Recipient phone number not in allowed list") — la causa real y su fix están documentados en [§10](#10-normalización-del-teléfono) |
| Plantilla de Meta `confirmar_reserva` (evento `reserva_confirmada`) | **Aprobada por Meta.** Nombre real: `confirmar_reserva`, no `reserva_confirmada` — `WHATSAPP_TEMPLATE_RESERVA_CONFIRMADA` en `.env.local` ya está actualizado con el nombre correcto |
| Plantilla para `pago_confirmado` | Sin crear/sin configurar (`WHATSAPP_TEMPLATE_PAGO_CONFIRMADO` vacío en `.env.local`) |

**Nada de esto envía mensajes reales salvo que, en el entorno donde corre,
`WHATSAPP_ENABLED=true` y `WHATSAPP_DRY_RUN=false` estén ambos seteados y
haya credenciales válidas.** Ver [§9](#9-comportamiento-por-modo-disabled--dry-run--live).

---

## 3. Arquitectura y flujo general

Patrón: capa fina de "dispatcher" (`lib/notifications/notify.ts`) que, para
cada evento de negocio, intenta **dos canales en paralelo** (`Promise.allSettled`)
— email (Resend, canal existente) y WhatsApp (Cloud API, canal nuevo) — de
forma completamente independiente. Un fallo de un canal nunca afecta al otro,
y ningún fallo de notificación revierte la reserva o el pago que ya quedó
persistido antes de invocar al dispatcher.

Cada canal, para cada intento, sigue siempre la misma secuencia:

1. Determinar si corresponde enviar (feature habilitada, consentimiento, teléfono válido, plantilla configurada).
2. Construir su `deduplication_key` determinística.
3. Reclamar atómicamente una fila en `notification_log` (RPC `claim_notification_attempt`).
4. Si no se pudo reclamar (`claimed=false`), abstenerse — no se llama al proveedor.
5. Invocar al proveedor (Resend o Graph API de WhatsApp).
6. Completar el intento (`complete_notification_attempt`) como `sent`, `failed` o `skipped`, con clasificación de si es reintentable.
7. Registrar errores sanitizados (nunca tokens, headers, secretos, ni la respuesta completa del proveedor).

```
Reserva creada / pago confirmado
        │
        ▼
lib/notifications/notify.ts
  notifyReservationConfirmed() / notifyPaymentConfirmed()
        │
        ├── Promise.allSettled ──┬── canal email (Resend, existente)
        │                        └── canal whatsapp (Cloud API, nuevo)
        │
        ▼ (cada canal, independiente)
  claimNotification()  →  notification_log (INSERT/UPDATE atómico vía RPC)
        │
        ▼
  proveedor (Resend / Graph API)
        │
        ▼
  completeNotification()  →  notification_log (status final)
```

---

## 4. Estructura de archivos involucrados

### Dispatcher de notificaciones
- `lib/notifications/types.ts` — tipos compartidos (canal, delivery mode, evento, status, params de claim/complete).
- `lib/notifications/idempotency.ts` — construcción determinística de `deduplication_key` por evento.
- `lib/notifications/claim.ts` — wrapper TS sobre las RPC `claim_notification_attempt` / `complete_notification_attempt`.
- `lib/notifications/payload.ts` — `sanitizeNotificationPayload`, redacta claves sospechosas y descarta valores anidados antes de persistir.
- `lib/notifications/notify.ts` — orquestación pública: `notifyReservationConfirmed`, `notifyPaymentConfirmed`.

### Cliente y utilidades de WhatsApp
- `lib/whatsapp/phone.ts` — `normalizeArgentinePhone`, normalización heurística a E.164 argentino.
- `lib/whatsapp/config.ts` — `loadWhatsAppConfig` / `validateWhatsAppConfig` / `getTemplateConfig`, lee variables de entorno.
- `lib/whatsapp/client.ts` — `sendWhatsAppTemplateMessage`, único punto que hace `fetch` real a la Graph API.
- `lib/whatsapp/errors.ts` — `classifyWhatsAppError`, clasifica recuperable/permanente.
- `lib/whatsapp/templates.ts` — construcción y validación de los `components` (variables posicionales) por evento.

### Zona horaria
- `lib/date/timezone.ts` — `BUSINESS_TIMEZONE` + formatters de fecha/hora para WhatsApp, sin conversión vía `Date`/`Intl` (evita corrimientos de día por huso horario del runtime).

### Integración con reservas/pagos
- `app/api/reservations/route.ts` — crea la reserva, valida/normaliza teléfono, llama al dispatcher tras la RPC.
- `lib/admin/reservas-actions.ts` — `confirmReservationPayment`, extraído del route handler admin para poder testear la transición de pago sin montar `Request`/`Response`.
- `app/api/admin/reservations/[id]/route.ts` — la acción `confirm` delega en `confirmReservationPayment`. Las acciones `cancel`/`delete` **no** fueron tocadas por este módulo (siguen usando solo el email existente).
- `components/clases/ClassReservationForm.tsx` — checkbox de consentimiento + validación visual (no autoritativa) de teléfono.

### Migraciones (`supabase/migrations/`)
- `20260709000001_notification_log.sql`
- `20260710000001_reservations_whatsapp_consent.sql`
- `20260711000001_create_reservation_atomic_whatsapp_fields.sql`
- `20260712000001_grant_service_role_read_access.sql`
- `20260712000002_grant_service_role_remaining_tables.sql`
- `20260712000003_classes_deposit_amount.sql`

### Tests de integración SQL (`supabase/tests/`)
- `notification_log_integration.sql`
- `reservations_whatsapp_consent_integration.sql`
- `create_reservation_atomic_whatsapp_fields_integration.sql`

Ninguno de estos tres se ejecuta automáticamente — son scripts manuales,
pensados para correr contra Postgres/Supabase local, terminan siempre en
`ROLLBACK` (no dejan datos).

---

## 5. Integración con la creación de reservas

Flujo en `app/api/reservations/route.ts` (`POST`):

1. Validaciones existentes sin cambios (rate limit, campos requeridos, email, cupos).
2. **Nuevo:** si se cargó teléfono, se valida con `normalizeArgentinePhone` — si el formato es inválido, `400 { error: "invalid_phone" }` **antes** de crear la reserva. El teléfono sigue siendo opcional; si no se cargó ninguno, no se rechaza nada.
3. Se llama a la RPC `create_reservation_atomic` (ver [§12](#12-migraciones-relacionadas)) pasando, además de los 7 parámetros originales, el teléfono normalizado y el consentimiento — **todo se persiste en la misma transacción que crea la reserva**, no en un `UPDATE` separado posterior.
4. Después de la RPC, el handler **relee desde la base** (`customer_phone_normalized`, `whatsapp_consent`) antes de notificar — nunca usa el valor recibido en el request en memoria. Esto cubre tanto el alta nueva como una réplica por `idempotency_key` (donde lo que vale es lo que quedó persistido en el alta original, no el request repetido).
5. Se llama a `notifyReservationConfirmed(supabase, {...})`, con `try/catch` que nunca deja que un error de notificación tumbe la respuesta.
6. La respuesta al cliente (`{ ok: true, id }`) no depende del resultado de los proveedores.

## 6. Integración con la confirmación de pago

`lib/admin/reservas-actions.ts::confirmReservationPayment`:

- Hace el mismo `UPDATE ... WHERE status = 'pending'` que ya existía (sin cambios de comportamiento), ahora trayendo también `customer_phone_normalized` y `whatsapp_consent` en el `select()`.
- **La garantía "solo notifica ante una transición real" vive enteramente en esa cláusula `WHERE`**: si la fila no estaba en `pending` (ya confirmada, cancelada, o no existe), el `UPDATE` no matchea nada, `data` sale `null`, y `notifyPaymentConfirmed` nunca se llama. Repetir la acción (doble click, POST repetido) cae siempre en esa rama después del primer éxito.
- Si `notifyPaymentConfirmed` lanza una excepción inesperada, se captura y se devuelve `ok: true` igual (el pago ya quedó persistido; la notificación fallida no debe revertirlo).
- `app/api/admin/reservations/[id]/route.ts` (acción `confirm`) es ahora un wrapper delgado sobre esta función.

---

## 7. Canal email (comportamiento)

Sin cambios de contenido respecto al Resend existente — mismos templates
(`lib/resend/template.ts`), mismas funciones de envío
(`lib/resend/send.ts`), mismo timeout de 5s. Lo único nuevo: **cada envío de
email ahora también reclama su propia fila en `notification_log`** (canal
`email`, `delivery_mode` siempre `'live'`), con la misma
`deduplication_key` base que usa WhatsApp para el mismo evento
(`reserva_confirmada:{reservationId}` / `pago_confirmado:{reservationId}`),
pero en una fila **separada** (la clave única de la tabla es
`(channel, delivery_mode, deduplication_key)`). Esto evita un segundo email
por doble submit o reintento, igual que ya se garantiza para WhatsApp.

## 8. Canal WhatsApp (comportamiento)

`attemptWhatsAppChannel` (dentro de `lib/notifications/notify.ts`) hace,
en orden:

1. Si `WHATSAPP_ENABLED=false` → **no reclama nada, no crea fila**, devuelve `outcome: "disabled"` de inmediato. Ver [§9](#9-comportamiento-por-modo-disabled--dry-run--live).
2. Calcula `delivery_mode` (`'live'` si habilitado y no dry-run, `'dry_run'` si no) y reclama con esa clave.
3. Si no se ganó el reclamo (`claimed=false`) → no se envía nada.
4. Gating, en este orden — cada uno completa la fila como `skipped` (nunca `failed`, nunca reintentable):
   - Sin consentimiento → `errorCode: "consent_missing"`.
   - Sin teléfono normalizado válido → `errorCode: "invalid_or_missing_phone"`.
   - Sin nombre de plantilla configurado para ese evento → `errorCode: "template_not_configured"`.
5. Construye los `components` (`lib/whatsapp/templates.ts`) — si faltan variables o son inválidas, se completa como `failed`, `retryable: false` (`errorCode: "invalid_template_vars"`).
6. Llama a `sendWhatsAppTemplateMessage` y mapea el resultado: `sent` → `status: "sent"`; `disabled`/`dry_run` → `status: "skipped"`; `error` → `status: "failed"` con `retryable` según `classifyWhatsAppError`.

## 9. Comportamiento por modo (disabled / dry run / live)

| Modo | Condición | ¿Reclama fila? | `delivery_mode` | ¿Request HTTP real? | Status final |
|---|---|---|---|---|---|
| **Disabled** | `WHATSAPP_ENABLED=false` | **No** | — | No | — (no hay fila) |
| **Dry run** | `WHATSAPP_ENABLED=true`, `WHATSAPP_DRY_RUN=true` | Sí | `dry_run` | No (el cliente corta antes de `fetch`) | `skipped` (`errorCode: "dry_run"`) |
| **Live** | `WHATSAPP_ENABLED=true`, `WHATSAPP_DRY_RUN=false` | Sí | `live` | Sí | `sent` / `failed` |

Punto de diseño importante: **disabled y dry-run nunca consumen la
`deduplication_key` de `live`** (son filas distintas por `delivery_mode`).
Un intento en dry-run no bloquea un envío real futuro del mismo evento.
Verificado con test dedicado en `lib/notifications/notify.test.ts`
("disabled no crea claim...").

---

## 10. Normalización del teléfono

`lib/whatsapp/phone.ts::normalizeArgentinePhone` — heurística (no hay tabla
de códigos de área), cubre: E.164 completo (con o sin "9"), prefijo `00`,
`0` + área + `15` (marcación doméstica vieja), área + abonado sin `15`.
Devuelve `{ valid, e164, reason? }`, nunca lanza.

**Formato del campo `e164` — sin el dígito "9"**: el valor que devuelve esta
función (y que se persiste en `customer_phone_normalized`) es
`54` + área + abonado (10 dígitos), **sin** el "9" que sí lleva el E.164
"oficial" para celulares argentinos. Esto no es un descuido: se corrigió el
2026-07-11 después de que un envío real fallara con el error de Meta
`131030` ("Recipient phone number not in allowed list") al mandar
el formato con "9" a un destinatario argentino verificado en Meta. El mismo
número anonimizado, reenviado sin el "9", produjo `status: sent`,
`provider_message_id` real devuelto por la Graph API. Meta dejó de requerir
el "9" para mensajería en números argentinos hace varios años (sigue
existiendo para marcación telefónica tradicional); el código anterior lo
agregaba por error, replicando el formato de llamada en vez del que espera
la Cloud API. Verificado con un solo número real, no exhaustivamente contra
distintos códigos de área.

- `customer_phone` (columna original) conserva **siempre** el valor tal cual
  lo tipeó la persona.
- `customer_phone_normalized` (columna nueva) guarda el valor calculado
  **una sola vez, en el servidor**, antes de persistir la reserva. El
  dispatcher nunca vuelve a normalizar desde texto libre — siempre consume
  el valor ya normalizado.
- Reservas históricas (o sin teléfono) quedan con `customer_phone_normalized = null` — no se migran ni normalizan retroactivamente.
- Teléfono sigue siendo **opcional**: sin teléfono válido, no hay WhatsApp, pero el email y la creación de la reserva funcionan igual.

## 11. Consentimiento y persistencia

- Columnas `reservations.whatsapp_consent` (`boolean not null default false`) y `whatsapp_consent_at` (`timestamptz`).
- **Invariante de base de datos** (constraint `reservations_whatsapp_consent_consistency`, ver [§12](#12-migraciones-relacionadas)): `whatsapp_consent = true` exige `whatsapp_consent_at` no nulo **y** `customer_phone_normalized` no nulo/no vacío/no solo-espacios. `whatsapp_consent = false` exige `whatsapp_consent_at` nulo.
- El consentimiento se persiste **dentro de la misma transacción** que crea la reserva (parámetros de `create_reservation_atomic`), no en un `UPDATE` separado — así WhatsApp nunca se intenta a partir de un consentimiento que no quedó efectivamente en la base.
- Checkbox en `components/clases/ClassReservationForm.tsx`: **sin marcar por defecto**, `id`/`htmlFor` asociados explícitamente, texto:
  > "Acepto recibir por WhatsApp confirmaciones, recordatorios y avisos relacionados con mi reserva."
  (no menciona promociones/marketing).
- El solo hecho de tener un teléfono cargado **no** implica consentimiento — son campos independientes; es válido tener teléfono con `whatsapp_consent = false` (dato de contacto general).
- Reservas históricas o sin consentimiento: tratadas siempre como "sin consentimiento" — nunca reciben WhatsApp, el email sigue funcionando igual que siempre.

---

## 12. Migraciones relacionadas

| Migración | Contenido | Estado git |
|---|---|---|
| `20260709000001_notification_log.sql` | Tabla `notification_log` + RPC `claim_notification_attempt` / `complete_notification_attempt` | Committeada (`c49f9c4`) |
| `20260710000001_reservations_whatsapp_consent.sql` | Columnas `whatsapp_consent`, `whatsapp_consent_at` (sin constraint todavía, a propósito) | Committeada (`c49f9c4`) |
| `20260711000001_create_reservation_atomic_whatsapp_fields.sql` | Columna `customer_phone_normalized`, constraint `reservations_whatsapp_consent_consistency`, reemplazo de `create_reservation_atomic` (10 parámetros), `grant`/`revoke`, `notify pgrst, 'reload schema'` | Committeada (`c49f9c4`) |
| `20260712000001_grant_service_role_read_access.sql` | `GRANT SELECT/INSERT/UPDATE/DELETE` a `service_role` sobre `classes`/`reservations`; `SELECT` sobre la vista `classes_with_availability` | **Sin commitear** (archivo nuevo, no trackeado) |
| `20260712000002_grant_service_role_remaining_tables.sql` | Mismo grant sobre `inquiries`, `recetas`, `challenge_submissions` | **Sin commitear** |
| `20260712000003_classes_deposit_amount.sql` | Columna `classes.deposit_amount numeric(10,2)` — el código ya la usaba (formulario admin, email de confirmación) pero ninguna migración la creaba | **Sin commitear** |

**Ninguna de las 6 corrió nunca contra la base de producción real.** Todas
se probaron exclusivamente contra Postgres local efímero y contra el stack
de Supabase CLI local (`supabase db reset` + scripts de `supabase/tests/`).

### Tablas, columnas, constraints, RPC y permisos (detalle)

**`notification_log`** (nueva): `channel` (`whatsapp`|`email`), `delivery_mode`
(`live`|`dry_run`), `event_type`, `deduplication_key`, `reservation_id` (FK
`ON DELETE SET NULL`), `class_id` (FK `ON DELETE SET NULL`), `recipient`,
`template_name`, `payload jsonb`, `status`
(`processing`|`sent`|`delivered`|`read`|`failed`|`skipped`),
`provider_message_id`, `claim_token uuid`, `attempt_count`, `max_attempts`,
`retryable`, `next_retry_at`, `processing_started_at`, `last_attempt_at`,
`completed_at`, `error_code` (≤100 chars), `error_message` (≤500 chars).
Constraint único `(channel, delivery_mode, deduplication_key)`. RLS
habilitado, sin policies — acceso exclusivamente vía las dos RPC
`SECURITY DEFINER`, con `EXECUTE` otorgado explícitamente a `service_role`
(nunca por privilegio implícito) y revocado de `public`/`anon`/`authenticated`.
No hay `GRANT` de tabla directo para `notification_log` — es intencional,
fuerza que todo pase por el claim atómico.

**`reservations`** (extendida): `+customer_phone_normalized text`,
`+whatsapp_consent boolean not null default false`,
`+whatsapp_consent_at timestamptz`, constraint
`reservations_whatsapp_consent_consistency` (ver [§11](#11-consentimiento-y-persistencia)).

**`classes`** (extendida): `+deposit_amount numeric(10,2)` con check
`deposit_amount is null or deposit_amount >= 0`.

**RPC `claim_notification_attempt`** (10 parámetros: canal, dedup key,
evento, destinatario, reservation_id, class_id, template_name, payload,
delivery_mode, max_attempts, stale_after_minutes) — reclama atómicamente
(`INSERT ... ON CONFLICT`), emite un `claim_token` nuevo por reclamo,
recupera leases vencidos.

**RPC `complete_notification_attempt`** (id, claim_token, status,
provider_message_id, error_code, error_message, retryable, next_retry_at) —
exige el `claim_token` vigente; si no coincide (lease perdido), no actualiza
nada y devuelve `false`.

**RPC `create_reservation_atomic`** — signature final (10 parámetros):
`p_class_id, p_customer_email, p_customer_name, p_customer_phone,
p_idempotency_key, p_notes, p_spots, p_customer_phone_normalized,
p_whatsapp_consent, p_whatsapp_consent_at`. La versión vieja de 7 parámetros
se elimina explícitamente con `DROP FUNCTION` antes de crear la nueva (evita
que PostgREST vea dos sobrecargas ambiguas — mismo problema que ya había
resuelto `20260601000001_drop_old_rpc_overload.sql`). Valida al inicio (antes
del lock de clase, cupos e `INSERT`) que `whatsapp_consent = true` no venga
sin `customer_phone_normalized` (`raise exception
'invalid_whatsapp_consent: normalized phone is required'`). `EXECUTE`
otorgado explícitamente a `service_role`, revocado de
`public`/`anon`/`authenticated`. Termina con
`NOTIFY pgrst, 'reload schema'`.

**Permisos de tabla para `service_role`** (migraciones `20260712000001`/`002`,
sin commitear): `classes`, `reservations` →
`SELECT, INSERT, UPDATE, DELETE`; vista `classes_with_availability` →
`SELECT`; `inquiries`, `recetas`, `challenge_submissions` →
`SELECT, INSERT, UPDATE, DELETE`. Se agregaron porque **ninguna migración
anterior del proyecto otorgaba esto explícitamente** — funcionaba en el
proyecto hosteado por privilegios heredados/manuales, pero no en un stack de
Supabase local recién inicializado (confirmado con `permission denied` real
al probar `/calendario` y `/recetas` en local).

---

## 13. Idempotencia y `deduplication_key`

`lib/notifications/idempotency.ts`. Cada `deduplication_key` identifica un
**evento de negocio**, no solo una reserva:

| Evento | Clave |
|---|---|
| Confirmación de reserva | `reserva_confirmada:{reservationId}` |
| Confirmación de pago | `pago_confirmado:{reservationId}` |
| Cancelación *(clave definida, sin usar todavía — ver [§19](#19-fuera-de-alcance-actual))* | `cancelacion:{reservationId}` |
| Recordatorio *(clave definida, sin usar todavía)* | `recordatorio:{reservationId}:{classDateISO}` |
| Reprogramación *(clave definida, sin usar todavía)* | `reprogramacion:{reservationId}:{hash(transición vieja→nueva)}` |

La unicidad real en la base es `(channel, delivery_mode, deduplication_key)`
— el mismo evento puede tener una fila por email y otra por WhatsApp, y una
fila `dry_run` y otra `live` sin pisarse.

## 14. Claim, lease, reintentos y recuperación de procesos

- **Claim atómico**: `claim_notification_attempt` hace `INSERT ... ON CONFLICT DO UPDATE ... WHERE <condición>` en una sola sentencia — nunca se inserta el registro después de enviar.
- **Lease**: cada reclamo (nuevo o recuperado) emite un `claim_token` (uuid) distinto. `complete_notification_attempt` exige que el token coincida y que el status siga en `processing`; si otro proceso ya reclamó la fila (lease vencido y recuperado), la actualización no tiene efecto (`updated: false`) — el worker que perdió el lease no puede pisar un resultado más nuevo.
- **Recuperación de huérfanos**: una fila en `processing` con `processing_started_at` más vieja que `stale_after_minutes` (default 10) se puede reclamar de nuevo — no hay un job de limpieza aparte, el próximo intento destraba la fila.
- **Reintentos**: `attempt_count` / `max_attempts` (default 5). Un error se completa con `retryable: true|false`. `retryable = true` siempre fija `next_retry_at` (nunca queda nulo); `retryable = false` siempre lo fuerza a `null`. Una fila con `attempt_count >= max_attempts` no se vuelve a reclamar aunque sea reintentable.
- **No hay worker automático de reintentos todavía** — la clasificación queda correctamente persistida para una etapa posterior (ver [§19](#19-fuera-de-alcance-actual)).
- **Limitación documentada, no resuelta**: si el proveedor acepta el mensaje pero el proceso se cae antes de persistir la respuesta, la fila puede quedar en `processing`, reclamarse de nuevo, y reintentar el envío — posible duplicado del lado del cliente final. Este diseño da idempotencia *best-effort* de nuestro lado (nunca dos reclamos simultáneos, nunca se pisa un resultado ya persistido), **no una garantía de "exactly once" end-to-end**.

## 15. Clasificación de errores (WhatsApp)

`lib/whatsapp/errors.ts::classifyWhatsAppError`:

- **Recuperables** (`retryable: true`): `network_error`, `timeout`, HTTP 429, HTTP 5xx.
- **No recuperables** (`retryable: false`, default conservador): `config_invalid`, cualquier código de error propio de Meta (ej. 190 = token inválido, 100 = parámetro/plantilla inválida), y cualquier código no reconocido.
- Consentimiento ausente y teléfono inválido/ausente **no pasan por esta clasificación** — se resuelven como `skipped` antes de intentar el envío, nunca como fallo técnico.

---

## 16. Variables de entorno

Documentadas en `.env.example` (valores reales nunca en este documento):

```
WHATSAPP_ENABLED                       # default false
WHATSAPP_DRY_RUN                       # default true
WHATSAPP_API_VERSION                   # default v21.0
WHATSAPP_ACCESS_TOKEN
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_BUSINESS_ACCOUNT_ID           # opcional
WHATSAPP_APP_SECRET                    # NO se usa para enviar — reservada para validar firma de webhook (fuera de alcance actual)
WHATSAPP_TEMPLATE_RESERVA_CONFIRMADA
WHATSAPP_TEMPLATE_PAGO_CONFIRMADO
WHATSAPP_TEMPLATE_RECORDATORIO         # sin uso todavía (evento no implementado)
WHATSAPP_TEMPLATE_CANCELACION          # sin uso todavía
WHATSAPP_TEMPLATE_REPROGRAMACION       # sin uso todavía
WHATSAPP_TEMPLATE_LANGUAGE             # default es_AR
```

En `.env.local` (no versionado) están cargadas con credenciales reales de
**prueba** de un número de test de Meta, para validar el envío real contra
Supabase local — nunca confirmadas ni cargadas en Vercel/producción.

## 17. Plantillas necesarias

Dos plantillas de Meta (categoría `UTILITY`), nombres configurables por
variable de entorno (nunca hardcodeados en código):

| Evento | Nombre real en Meta | Variables esperadas, en orden | Estado en Meta (al momento de este documento) |
|---|---|---|---|
| `reserva_confirmada` | `confirmar_reserva` | nombre, clase, fecha, horario, cupos (5) | **Aprobada.** Idioma aprobado sin confirmar explícitamente contra Meta todavía (`.env.local` tiene `es`, el default de código es `es_AR`) |
| `pago_confirmado` | *(sin configurar)* | nombre, clase, fecha, horario (4) | **No creada todavía** |

`lib/whatsapp/templates.ts` valida cantidad, presencia y largo razonable
(≤300 caracteres) de cada variable antes de armar el payload — si falta
alguna o el nombre de plantilla no está configurado, el envío se omite
(`skipped`) o falla como no reintentable, nunca se manda un mensaje a medias.

---

## 18. Tests

### Unitarios (`node --test`, 96 tests / 11 archivos, todos en verde localmente)

- `lib/notifications/idempotency.test.ts`
- `lib/notifications/claim.test.ts`
- `lib/notifications/payload.test.ts`
- `lib/notifications/notify.test.ts` — batería principal: sin teléfono, sin consentimiento, teléfono inválido, disabled/dry-run sin request HTTP real (mock de `fetch`), duplicados, errores recuperables/permanentes, payload sanitizado, timezone.
- `lib/whatsapp/phone.test.ts`
- `lib/whatsapp/config.test.ts`
- `lib/whatsapp/client.test.ts`
- `lib/whatsapp/errors.test.ts`
- `lib/whatsapp/templates.test.ts`
- `lib/date/timezone.test.ts`
- `lib/admin/reservas-actions.test.ts` — transición `pending→confirmed`, conflicto, `db_error`, repetición sin doble notificación.

Ningún test hace requests reales ni envía emails reales — proveedores
siempre mockeados/inyectados.

### Integración SQL (manuales, `supabase/tests/`, no automatizadas en CI)

- `notification_log_integration.sql` — claim/complete, lease, reintentos, `ON DELETE SET NULL`, permisos por rol.
- `reservations_whatsapp_consent_integration.sql` — combinaciones válidas/inválidas del constraint de consistencia.
- `create_reservation_atomic_whatsapp_fields_integration.sql` — RPC extendida, validación de dominio, idempotencia, cupos, permisos, única sobrecarga.

Todas terminan en `ROLLBACK`. Probadas repetidas veces contra Postgres local
efímero y contra Supabase CLI local — **nunca contra producción**.

## Comandos de validación

```bash
npm test
npx tsc --noEmit
npx next lint
npx next build
```

Para las pruebas de integración SQL, contra un Postgres/Supabase local:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/<archivo>.sql
```

---

## 19. Fuera de alcance actual

No implementado, explícitamente pospuesto:

- Recordatorio automático antes de la clase (requiere cron).
- Cron / scheduling de cualquier tipo (ni Vercel Cron ni `pg_cron`).
- Aviso de cancelación de clase/reserva por WhatsApp (el email de cancelación existente no fue tocado).
- Aviso de reprogramación de clase.
- Webhook de estado de entrega (`delivered`/`read`) — `WHATSAPP_APP_SECRET` está reservado para esto pero no se usa todavía.
- Worker automático de reintentos (la clasificación `retryable`/`next_retry_at` ya queda persistida correctamente, pero nada la consume todavía).
- Panel administrativo de historial de notificaciones (`notification_log` no tiene UI de lectura).
- Conversaciones bidireccionales / chatbot / IA — explícitamente excluido por requisito de negocio, no solo por alcance.

## 20. Riesgos y limitaciones conocidas

- **El código ya llegó a desplegarse a producción sin las migraciones aplicadas** (commit `c49f9c4`, rollback manual vía Vercel). Mientras `main` no se revierta o las migraciones no se apliquen a producción, **un futuro push a `main` puede volver a desplegar este mismo código roto**. Ver [§21](#21-orden-seguro-de-despliegue) y [§22](#22-procedimiento-de-rollback).
- Heurística de normalización de teléfono argentino sin tabla real de códigos de área — cubre los formatos más comunes, no un parser exhaustivo. El riesgo específico del dígito "9" ya se verificó y corrigió con un envío real (ver [§10](#10-normalización-del-teléfono)), pero solo contra un número/área; pueden aparecer casos borde no cubiertos por los tests actuales.
- Discrepancia de schema entre el repo de migraciones y la base real ya documentada desde el inicio del proyecto ("reverse-engineered, verificar contra el schema real") — se confirmó de nuevo con el caso de `classes.deposit_amount`, ausente de toda migración pero usado en código productivo. Es razonable esperar más gaps de este tipo no descubiertos todavía.
- Idempotencia del lado del proveedor no garantizada end-to-end (ver [§14](#14-claim-lease-reintentos-y-recuperación-de-procesos)) — posible mensaje duplicado en una ventana de caída de proceso específica.
- `WHATSAPP_ACCESS_TOKEN` usado en las pruebas actuales es el **temporal de 24hs** de la consola de Meta, no un token permanente de System User — insuficiente para producción real.
- Sin verificación de negocio ni número de WhatsApp real conectado en Meta — solo número de prueba con destinatarios verificados manualmente (máximo 5).
- Plantilla `pago_confirmado` no existe todavía en Meta.

## 21. Orden seguro de despliegue

1. Verificar el schema real de producción antes de cualquier migración (`supabase db diff` o inspección manual vía dashboard) — no asumir que el repo de migraciones es 100% fiel (ver [§20](#20-riesgos-y-limitaciones-conocidas)).
2. Probar las 6 migraciones, en orden, contra un Supabase local limpio (`supabase db reset`) y correr los 3 scripts de `supabase/tests/`.
3. Aplicar las 6 migraciones contra staging (si existe) o directamente producción, en una ventana de bajo tráfico, con `WHATSAPP_ENABLED` todavía sin setear/`false`.
4. Probar el flujo de reserva/pago en producción con WhatsApp deshabilitado — confirmar que el email sigue llegando y que `create_reservation_atomic` de 10 parámetros funciona.
5. Recién ahí desplegar/re-promover el código de este módulo.
6. Smoke test: una reserva real, confirmar el email.
7. Solo después, si se desea, habilitar dry-run y luego envío real en producción.

## 22. Procedimiento de rollback

Ya ejecutado una vez (ver [§2](#2-estado-actual-resumen-ejecutivo)):

1. Vercel → Deployments → identificar el deployment previo al commit problemático → **"Promote to Production"** (no "Redeploy": reusa el build ya existente, no recompila, es casi instantáneo).
2. Confirmar que las reservas vuelven a funcionar.
3. `git revert` de `c49f9c4` (y del fix posterior `0d15db0`) sobre `main`, pusheado a `origin/main` — **ejecutado el 2026-07-10/11**. `origin/main` no tiene código de este módulo.

**Nota (2026-07-11)**: para retomar las pruebas de envío real tras la aprobación de la plantilla `confirmar_reserva`, esos dos reverts se revirtieron *de nuevo* — pero **solo en `main` local**, sin push. `origin/main` sigue sin el módulo; `main` local está adelantado y no debe pushearse sin aplicar antes las migraciones a producción (ver [§21](#21-orden-seguro-de-despliegue)).

---

## Historial de cambios

### 2026-07-16 — Módulo archivado por decisión comercial
- **Resumen**: la clienta decidió continuar exclusivamente con email. Esta versión documenta el último snapshot completo del módulo antes de retirarlo de `main`; el código reutilizable queda preservado en la rama `archive/whatsapp-notifications` y el tag `whatsapp-notifications-v1`.
- **Archivos afectados**: este documento, `AGENTS.md`, `lib/whatsapp/phone.ts` y su test para anonimizar la evidencia real antes del archivo.
- **Migraciones afectadas**: ninguna en el snapshot archivado. Las migraciones de WhatsApp nunca se aplicaron en producción.
- **Impacto funcional**: ninguno en producción. La eliminación del canal en el producto de la clienta se realiza posteriormente mediante un commit separado sobre `main`.
- **Seguridad y privacidad**: se retiró del documento, comentarios y tests el número usado en la prueba real; no se archivaron credenciales ni secretos.

### 2026-07-11 (continuación) — Primer envío real exitoso; fix del dígito "9" en teléfonos AR
- **Resumen**: con el módulo restaurado en `main` local (ver entrada anterior) y la plantilla `confirmar_reserva` ya aprobada por Meta, se ejecutó la primera prueba de envío real de principio a fin: `POST /api/reservations` contra Supabase local con un número de destinatario verificado en Meta. Primer intento: falló con error de Meta `131030` ("Recipient phone number not in allowed list") porque `normalizeArgentinePhone` anteponía un "9" que Meta no esperaba para ese destinatario; los valores concretos fueron anonimizados antes de archivar el módulo. Se corrigió `lib/whatsapp/phone.ts` para no anteponer el "9", y se reintentó: `notification_log` registró `status: sent` con un `provider_message_id` real de la Graph API para el canal `whatsapp`, y `sent` también para `email`.
- **Archivos afectados**: `lib/whatsapp/phone.ts` (se quita el "9" del formato devuelto en `e164`, comentarios actualizados con la evidencia real), `lib/whatsapp/phone.test.ts` (expectativas actualizadas + test nuevo específico del caso real), este documento (§2, §10, §17, §20, §22).
- **Migraciones afectadas**: ninguna.
- **Pruebas ejecutadas**: `node --no-warnings --experimental-strip-types --test "lib/**/*.test.ts"` (96/96 verde, incluye el test nuevo) y `npx tsc --noEmit` (limpio) después del fix. Prueba de integración real: reserva de prueba vía `POST /api/reservations` local, verificada leyendo `notification_log` directo en la base (`docker exec ... psql`) — no un mock, un envío real que llegó a la Graph API de Meta.
- **Impacto funcional**: ninguno en producción — todo esto ocurrió en `main` local (sin push) contra Supabase local. El fix de `phone.ts` es funcional y quedará incluido cuando este código se pushee/despliegue.
- **Riesgos o pendientes**: la corrección del "9" se verificó con un solo número — no exhaustivamente. `pago_confirmado` sigue sin plantilla en Meta. El módulo fue archivado posteriormente y no se aplicarán sus migraciones en el producto actual.

### 2026-07-11 — Revert pusheado a origin/main, luego restauración local para retomar pruebas
- **Resumen**: se completó el pendiente del documento anterior. Se commiteó el fix de `WHATSAPP_APP_SECRET` + las 3 migraciones de grants/`deposit_amount` (commit `0d15db0`), se revirtió ese commit (`5f21ae5`) y se revirtió `c49f9c4` (`2cecba4`) — dejando `origin/main` sin ningún rastro del módulo, alineado con lo que corre en producción. Se pusheó. Más tarde, Meta activó/aprobó la plantilla `confirmar_reserva` (nombre real de lo que este documento llamaba `reserva_confirmada`); para poder retomar la prueba de envío real se revirtieron ambos reverts *solo en `main` local* (`git revert` sobre `2cecba4` y sobre `5f21ae5`), sin pushear. Se verificó contra la base local real (`docker exec ... psql`) que el schema y los grants ya estaban aplicados de una sesión anterior, sin necesidad de `db reset`.
- **Archivos afectados**: ninguno funcional en esta tarea puntual — solo este documento. El código restaurado es el mismo que ya existía (sin cambios de contenido).
- **Migraciones afectadas**: ninguna aplicada/creada en esta tarea. Las 6 migraciones del módulo siguen sin aplicarse contra producción real; siguen aplicadas y verificadas contra la base local.
- **Pruebas ejecutadas**: `node --no-warnings --experimental-strip-types --test "lib/**/*.test.ts"` (95/95 verde) y `npx tsc --noEmit` (limpio) después de restaurar el código localmente.
- **Impacto funcional**: ninguno en producción (los reverts pusheados ya se hicieron antes de esta entrada; la restauración posterior es solo local, sin push). `origin/main` y Vercel no cambiaron como resultado de esta tarea.
- **Riesgos o pendientes**: `main` local quedó 2 commits adelante de `origin/main` — no pushear sin antes aplicar las 6 migraciones a producción siguiendo [§21](#21-orden-seguro-de-despliegue), o se repite el incidente original. Falta confirmar el idioma exacto aprobado por Meta para `confirmar_reserva` (`es` vs `es_AR`) y regenerar `WHATSAPP_ACCESS_TOKEN` (el temporal probablemente venció). `pago_confirmado` sigue sin plantilla.

### 2026-07-10 — Documentación inicial del módulo
- **Resumen**: primera versión de este documento, auditando el estado real del repositorio después de: Etapa 1 (infraestructura `notification_log` + `lib/whatsapp`), Etapa 2 (dispatcher conectado a confirmación de reserva/pago, consentimiento, teléfono normalizado), correcciones de idempotencia/permisos/schema, un incidente de producción (deploy sin migraciones aplicadas) y su rollback, y una prueba en curso de envío real contra el número de test de Meta.
- **Archivos afectados**: ninguno funcional — solo `docs/whatsapp-notifications.md` (nuevo) y regla agregada en `AGENTS.md`.
- **Migraciones afectadas**: ninguna aplicada en esta tarea (documentación únicamente). Estado registrado: 3 migraciones committeadas sin aplicar a producción, 3 migraciones sin commitear.
- **Pruebas ejecutadas**: `npm test` (95/95 verde) para confirmar el número reportado en este documento; no se ejecutaron migraciones ni tests de integración SQL como parte de esta tarea puntual (ya habían corrido en tareas anteriores de la misma sesión).
- **Impacto funcional**: ninguno (solo documentación).
- **Riesgos o pendientes**: ver [§20](#20-riesgos-y-limitaciones-conocidas). Pendiente inmediato más urgente: decidir sobre el `git revert` de `c49f9c4` y sobre cuándo aplicar las migraciones a producción siguiendo el orden de [§21](#21-orden-seguro-de-despliegue).
