# MENESTERES — HANDOFF TÉCNICO COMPLETO

---

## 1. RESUMEN DEL PROYECTO

**Objetivo:** Sistema web de gestión de clases de cocina con reservas públicas y panel de administración privado.

**Problema que resuelve:** Una profesora de cocina necesitaba recibir reservas online, gestionar cupos, confirmar pagos y comunicarse con clientes sin herramientas manuales (WhatsApp/formularios de Google).

**Usuarios objetivo:**
- **Público:** Clientes que reservan clases desde el sitio.
- **Admin:** La dueña del negocio, que gestiona clases y reservas desde un panel privado.

**Flujo principal:**
1. Cliente ve calendario público con clases disponibles.
2. Selecciona clase → llena form de reserva (nombre, email, teléfono, cupos, notas).
3. Supabase crea la reserva con `create_reservation_atomic` (transaccional, anti-doble-submit).
4. Se envían 2 emails automáticos: confirmación al cliente + notificación a la admin.
5. Admin entra a `/admin` con Magic Link → ve reservas → marca pagada o cancela.
6. Al marcar pagada/cancelar → email automático al cliente.

---

## 2. STACK TECNOLÓGICO

| Tecnología | Versión | Rol |
|---|---|---|
| Next.js | 15.5.15 | Framework principal (App Router) |
| React | 19.2.4 | UI |
| TypeScript | ^5 | Tipado |
| Tailwind CSS | ^4 | Estilos |
| Supabase | @supabase/supabase-js + @supabase/ssr | DB + Auth |
| Resend | latest | Emails transaccionales |
| date-fns | ^4 | Utilidades de fecha |

**Arquitectura elegida:** Next.js App Router con Server Components por defecto. Client Components solo donde hay interactividad (forms, botones con estado). Sin Redux ni Zustand — todo el estado es local o viene de Server Components.

**Por qué Supabase:** RLS + auth integrado + Postgres real + funciones transaccionales. El proyecto no necesita ORM complejo.

**Por qué Resend:** API simple, deliverability buena, sandbox fácil de testear sin dominio verificado.

---

## 3. ESTRUCTURA DEL PROYECTO

```
proyecto-menesteres/
├── app/
│   ├── layout.tsx                  # Layout raíz (Navbar global)
│   ├── page.tsx                    # Landing pública
│   ├── calendario/
│   │   └── page.tsx                # Calendario público con clases
│   ├── clases/
│   │   └── [slug]/
│   │       └── page.tsx            # Ficha de clase + form reserva
│   ├── admin/
│   │   ├── LogoutButton.tsx        # Botón logout (Client)
│   │   ├── login/
│   │   │   ├── page.tsx            # Página de login
│   │   │   └── LoginForm.tsx       # Form de magic link (Client)
│   │   ├── auth/callback/
│   │   │   └── route.ts            # Callback OAuth de Supabase
│   │   └── (protected)/            # Route Group — hereda layout admin
│   │       ├── layout.tsx          # Layout admin (fixed, z-9999, verifica auth)
│   │       ├── page.tsx            # Dashboard admin
│   │       ├── reservas/
│   │       │   ├── page.tsx        # Listado reservas + filtros + CSV
│   │       │   ├── ReservaActions.tsx  # Botones pagada/cancelar (Client)
│   │       │   └── FiltroMesForm.tsx   # Select de mes con router.push (Client)
│   │       └── clases/
│   │           ├── page.tsx        # Listado clases con filtro
│   │           ├── ClasesActions.tsx   # Botón cancelar clase (Client)
│   │           ├── ClaseFormCliente.tsx # Form crear/editar clase (Client)
│   │           ├── nueva/
│   │           │   └── page.tsx    # Página crear clase
│   │           └── [id]/
│   │               └── page.tsx    # Página editar clase
│   └── api/
│       ├── reservations/
│       │   └── route.ts            # POST — crear reserva pública
│       └── admin/
│           ├── reservations/
│           │   ├── [id]/
│           │   │   └── route.ts    # POST — confirm/cancel reserva
│           │   └── export/
│           │       └── route.ts    # GET — exportar CSV
│           └── classes/
│               ├── route.ts        # POST — crear clase
│               ├── template/
│               │   └── route.ts    # GET — plantilla por slug
│               └── [id]/
│                   ├── route.ts    # PATCH — editar clase
│                   └── cancel/
│                       └── route.ts # POST — cancelar clase + cascada
├── lib/
│   ├── supabase/
│   │   ├── server.ts               # getSupabaseAdmin() — service role key
│   │   ├── browser.ts              # createBrowserClient()
│   │   └── auth-server.ts          # getCurrentUserEmail()
│   ├── admin/
│   │   ├── config.ts               # ADMIN_ALLOWLIST = ['lautarobarba1@gmail.com']
│   │   ├── reservas-queries.ts     # getReservasForAdmin(), reservasToCSV()
│   │   └── clases-queries.ts       # getClasesForAdmin(), countActiveReservations()
│   │   └── clases-validation.ts    # slugFromTitle(), validateClaseForm(), getTemplateBySlug()
│   └── resend/
│       ├── client.ts               # new Resend(API_KEY)
│       ├── templates.ts            # HTML templates de emails
│       └── send.ts                 # sendEmailReservaConfirmacion/Admin/Confirmada/Cancelada
├── components/
│   ├── layout/
│   │   └── Navbar.tsx              # Navbar global del sitio público
│   └── ui/
│       ├── Button.tsx
│       ├── form.tsx                # Field, FormInput, FormSelect, FormTextarea, FormError
│       └── HoneypotField.tsx
├── middleware.ts                   # Protege /admin/* salvo /admin/login y /admin/auth/callback
├── next.config.ts                  # remotePatterns: unsplash.com, imgur.com
└── .env.local                      # Variables de entorno (ver sección 4)
```

---

## 4. ARQUITECTURA Y LÓGICA DEL SISTEMA

### Variables de entorno requeridas
```env
SUPABASE_URL=https://rfpsqlqaqcwjzskkgril.supabase.co
SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
NEXT_PUBLIC_SUPABASE_URL=https://rfpsqlqaqcwjzskkgril.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
RESEND_API_KEY=re_...
```

### Fetching / API
- **Server Components** hacen queries directas a Supabase via `getSupabaseAdmin()`.
- **Client Components** llaman a Route Handlers (`/api/...`) vía `fetch`.
- No hay SWR ni React Query. Todo se refresca con `router.refresh()` tras mutaciones.

### Autenticación
- Supabase Auth con **Magic Link** (email).
- `middleware.ts` intercepta todas las rutas `/admin/*` y redirige a `/admin/login` si no hay sesión.
- `getCurrentUserEmail()` en `lib/supabase/auth-server.ts` verifica la sesión server-side.
- `isAdminEmail(email)` en `lib/admin/config.ts` verifica que el email esté en la allowlist.
- **Doble protección:** middleware + verificación en cada endpoint.

### Middleware
```typescript
// middleware.ts — en la raíz del proyecto
// Rutas protegidas: /admin/* excepto /admin/login y /admin/auth/callback
// Si no hay sesión → redirect a /admin/login
// Si hay sesión pero no es admin → redirect a /admin/login
```

### Roles y permisos
- **Público:** lectura de clases, crear reservas.
- **Admin:** todo. Verificado por allowlist hardcoded en `lib/admin/config.ts`.
- RLS en Supabase: lectura pública en `classes`, escritura solo via `service_role`.

### Gestión de errores
- Endpoints devuelven `{ error: "código_específico" }` con HTTP codes semánticos.
- Emails en try/catch — si fallan, la operación principal sigue adelante.
- Forms muestran errores por campo + error general de servidor.

---

## 5. BASE DE DATOS

### Supabase Project ID: `rfpsqlqaqcwjzskkgril`

### Tablas

#### `classes`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
slug            text NOT NULL
date            date NOT NULL
title           text NOT NULL
start_time      time NOT NULL
end_time        time NOT NULL
category_event  text NOT NULL  -- 'adultos' | 'ninos' | 'eventos'
short_desc      text
is_highlighted  boolean DEFAULT false
category_label  text           -- texto visible en ficha
description_long text
duration_label  text           -- ej: '3 horas'
image_src       text           -- URL externa (Unsplash/Imgur)
image_alt       text
total_spots     int NOT NULL
price           numeric(10,2)
payment_link    text           -- URL de Mercado Pago
is_cancelled    boolean DEFAULT false
UNIQUE(slug, date)
```

#### `reservations`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
class_id        uuid REFERENCES classes(id)
customer_name   text NOT NULL
customer_email  text NOT NULL
customer_phone  text
notes           text
spots           int NOT NULL DEFAULT 1
status          text DEFAULT 'pending'  -- 'pending' | 'confirmed' | 'cancelled'
idempotency_key uuid UNIQUE            -- anti doble-submit
created_at      timestamptz DEFAULT now()
confirmed_at    timestamptz
cancelled_at    timestamptz
```

### Vista
```sql
-- classes_with_availability
-- Agrega available_spots = total_spots - SUM(spots WHERE status IN ('pending','confirmed'))
-- Usada en el calendario público para mostrar cupos disponibles
```

### Función transaccional
```sql
create_reservation_atomic(
  p_class_id uuid,
  p_customer_email text,
  p_customer_name text,
  p_customer_phone text,
  p_idempotency_key uuid,
  p_notes text,
  p_spots int
) RETURNS TABLE(reservation_id uuid, was_created boolean, error_code text)
-- Hace SELECT FOR UPDATE para evitar race conditions
-- Verifica cupos disponibles antes de insertar
-- Retorna reservation_id (no los datos completos de la reserva)
```

**IMPORTANTE:** La función retorna solo `{reservation_id, was_created, error_code}`. Para obtener datos de la reserva creada, hacer query adicional a `reservations` por `reservation_id`.

### RLS
- `classes`: SELECT público, INSERT/UPDATE/DELETE solo service_role.
- `reservations`: INSERT/SELECT/UPDATE solo service_role.

---

## 6. FUNCIONALIDADES IMPLEMENTADAS

### 6.1 Calendario público
- **Qué hace:** Muestra clases futuras en vista de calendario con filtro por categoría.
- **Archivos:** `app/calendario/page.tsx`
- **Data:** Query a `classes_with_availability` via `getSupabaseAdmin()`.
- **Edge cases:** Clases canceladas se muestran con badge "Cancelada" pero sin form de reserva.

### 6.2 Sistema de reservas público
- **Qué hace:** Form en ficha de clase → crea reserva en DB → envía 2 emails.
- **Archivos:** `app/clases/[slug]/page.tsx`, `components/ui/ClassReservationForm.tsx`, `app/api/reservations/route.ts`
- **Flujo:**
  1. Form manda `{classId, name, email, phone, notes, spots, idempotencyKey, honeypot}`.
  2. Endpoint normaliza campos (el form usa `name/email`, el RPC usa `customer_name/customer_email`).
  3. Llama `create_reservation_atomic` con `p_idempotency_key`.
  4. Query adicional a `reservations` por `reservation_id` para obtener datos completos.
  5. Envía emails via Resend.
- **Edge cases:** Honeypot lleno → retorna 200 silencioso. Idempotency key evita doble submit. Cupos agotados → error `not_available`.

### 6.3 Auth admin (Magic Link)
- **Archivos:** `middleware.ts`, `app/admin/login/`, `app/admin/auth/callback/route.ts`, `lib/supabase/auth-server.ts`
- **Flujo:** Email → Magic Link → callback en `/admin/auth/callback` → cookie de sesión → middleware verifica en cada request.
- **Rate limit sandbox Supabase:** ~4 magic links/hora por IP.

### 6.4 Panel reservas + acciones
- **Archivos:** `app/admin/(protected)/reservas/page.tsx`, `ReservaActions.tsx`, `FiltroMesForm.tsx`
- **Filtros:** Por estado (pending/confirmed/cancelled) via searchParams. Por mes de la clase via Client Component con `router.push`.
- **Export CSV:** `GET /api/admin/reservations/export?estado=X&mes=YYYY-MM` → descarga `.csv`.
- **Acciones:** `POST /api/admin/reservations/[id]` con `{action: "confirm"|"cancel"}`.

### 6.5 Panel clases + CRUD
- **Archivos:** `app/admin/(protected)/clases/`, `ClaseFormCliente.tsx`, `lib/admin/clases-validation.ts`
- **Crear:** Auto-generación de slug desde título. Plantilla por slug (autocompleta campos de la última clase con ese slug).
- **Editar:** Form pre-llenado con datos actuales.
- **Cancelar:** Marca `is_cancelled=true` + cascada cancela todas las reservas `pending/confirmed`.
- **Validación:** `validateClaseForm()` en cliente y en endpoint. Unicidad `slug+date` via constraint Postgres.

### 6.6 Emails (Resend sandbox)
- **Archivos:** `lib/resend/client.ts`, `lib/resend/templates.ts`, `lib/resend/send.ts`
- **4 emails:**
  - `sendEmailReservaConfirmacion()` → al cliente al reservar.
  - `sendEmailAdminNewReserva()` → a la admin al recibir reserva.
  - `sendEmailReservaConfirmada()` → al cliente cuando admin marca pagada.
  - `sendEmailReservaCancelada()` → al cliente cuando se cancela reserva.
- **From actual (sandbox):** `onboarding@resend.dev`
- **ADMIN_EMAIL:** `lautarobarba1@gmail.com` (hardcoded en `send.ts`)
- **En sandbox:** todos los emails llegan solo al email registrado en Resend.

---

## 7. FUNCIONALIDADES PENDIENTES

### Alta prioridad
| Feature | Riesgo | Notas |
|---|---|---|
| Dominio real + Resend verificado | Bajo | Solo cambiar `from` y variable en Resend |
| Agregar email de la clienta a allowlist | Ninguno | Editar `lib/admin/config.ts` |
| Borrar clases seed del pasado | Ninguno | Query SQL directa en Supabase |
| Deploy a Vercel | Bajo | Cargar env vars, configurar dominio |
| Cambiar Site URL en Supabase Auth | Ninguno | Auth → URL Configuration |

### Media prioridad
| Feature | Riesgo | Notas |
|---|---|---|
| Upload de imágenes (Supabase Storage) | Medio | Reemplaza URLs externas en form de clase |
| Lista de espera | Medio | Ya hay hook en el form (`waitlist` mode) — falta endpoint |

### Baja prioridad
| Feature | Riesgo | Notas |
|---|---|---|
| Modal de confirmación (reemplazar `window.confirm`) | Ninguno | UX improvement |
| Paginación en panel reservas | Bajo | Actualmente trae 200, suficiente para MVP |
| Dashboard con métricas | Bajo | Página `/admin` tiene cards vacías |

---

## 8. DECISIONES TÉCNICAS IMPORTANTES

| Decisión | Por qué | NO cambiar |
|---|---|---|
| Route Group `(protected)` para admin | Excluye `/admin/login` del layout admin sin cambiar URL | La estructura de carpetas con paréntesis |
| Layout admin `fixed inset-0 z-[9999]` | Tapa el Navbar global sin modificar `app/layout.tsx` | El z-index y el `fixed` |
| Allowlist hardcoded | Simplicidad — un solo admin. No vale la pena tabla de roles | Puede moverse a env var si escala |
| RPC transaccional para reservas | Evita race conditions en cupos | No reemplazar por INSERT directo |
| Emails en try/catch que no bloquean | La reserva debe crearse aunque falle el email | Siempre envolver emails en try/catch |
| Query adicional post-RPC | `create_reservation_atomic` retorna solo el ID | Siempre hacer la query adicional |
| Imágenes como URLs externas | Simplicidad MVP | Se puede migrar a Storage después |
| No borrar clases — solo cancelar | FK de reservas lo impide | No agregar DELETE en clase con reservas |
| Slug + date = unique | Permite la misma clase en fechas distintas | El constraint es intencional |

---

## 9. BUGS CONOCIDOS

| Bug | Causa | Estado |
|---|---|---|
| URL de imagen incorrecta en seed | La clase seed tenía URL de página de Unsplash, no imagen directa | Resolver editando la clase desde admin |
| `next.config.ts` no existía | Proyecto iniciado sin configuración de imágenes | Resuelto: creado con `remotePatterns` |
| Filtro de mes por FK en Supabase | `.gte("classes.date", ...)` no filtra bien por relación FK | Resuelto: filtro adicional en JS post-query |

---

## 10. ESTILO DEL CÓDIGO

### Convenciones
- **Server Components** por defecto. `"use client"` solo si hay hooks de estado o browser APIs.
- **Tipos explícitos** en interfaces. Sin `any` — usar `unknown` y castear.
- **Nombres de archivos:** PascalCase para componentes (`ClaseFormCliente.tsx`), camelCase para utilities (`clases-queries.ts`).
- **Imports:** path aliases con `@/` — nunca rutas relativas largas como `../../../lib`.
- **Endpoints:** siempre `export const runtime = "nodejs"`. Auth check al inicio. Body parse en try/catch.
- **Emails:** siempre en try/catch que no bloqueen el flujo principal.

### Patrones usados
- **Sub-componentes locales** dentro del mismo archivo si son simples y solo se usan ahí (ej: `Th`, `Td`, `Section`, `FieldText` en los forms).
- **`router.refresh()`** después de mutaciones en Client Components — no recargar la página.
- **`searchParams`** para filtros en Server Components — URL como fuente de verdad.
- **`maybeSingle()`** en lugar de `single()` para queries que pueden retornar null.

### Design system (Tailwind)
- Colores custom: `terracota`, `terracota-deep`, `crema`, `crema-light`, `crema-deep`, `carbon`.
- Tipografía: `font-display` (headings), `font-body` (texto corrido), `font-mono` (labels/eyebrows), `font-sans` (UI).
- Tracking: `tracking-eyebrow` para labels de sección en mayúsculas.
- **No usar colores hardcoded** — usar siempre las variables del design system.

### Cómo agregar una feature nueva
1. Si es pública → en `app/` sin guard.
2. Si es de admin → en `app/admin/(protected)/` (hereda auth automáticamente).
3. Si necesita DB → query en `lib/admin/` o `lib/supabase/`.
4. Si necesita mutación → endpoint en `app/api/admin/` con auth check.
5. Si tiene form → Client Component separado del Server Component de la página.

---

## 11. PROMPT MAESTRO DEL PROYECTO

```
Sos un desarrollador senior trabajando en MENESTERES, un sistema de reservas de clases de cocina.

STACK: Next.js 15.5 (App Router), React 19, TypeScript, Tailwind 4, Supabase, Resend.

REGLAS DE TRABAJO:
1. Server Components por defecto. "use client" solo con estado o browser APIs.
2. Siempre verificar auth en endpoints admin: getCurrentUserEmail() + isAdminEmail().
3. Emails siempre en try/catch que no bloqueen el flujo principal.
4. Después de create_reservation_atomic(), hacer query adicional para obtener datos completos.
5. Usar router.refresh() para refrescar Server Components desde Client Components.
6. Usar searchParams para filtros — URL es fuente de verdad.
7. No usar colores hardcoded — usar variables del design system (terracota, carbon, crema).
8. No borrar clases con reservas asociadas — solo cancelar.
9. El form de reserva pública manda {name, email, phone} — el endpoint normaliza a {customerName, customerEmail, customerPhone}.
10. La función RPC retorna solo {reservation_id, was_created, error_code} — siempre hacer query adicional.

ANTES DE HACER CUALQUIER CAMBIO:
- Preguntar qué archivo está involucrado si no está claro.
- No asumir que un archivo existe — verificar con `dir` o `type`.
- No mover archivos sin avisar las consecuencias en imports.
- Si hay un error de TS, identificar la causa raíz antes de proponer fix.

ERRORES COMUNES A EVITAR:
- Poner await al top-level fuera de async function.
- Crear archivos Client Component con server imports.
- Olvidar el parámetro p_idempotency_key en create_reservation_atomic.
- Usar URLs de página de Unsplash en vez de URLs directas de imagen.
- Poner imports al final del archivo en lugar del principio.

FORMATO DE RESPUESTA:
- Indicar exactamente qué archivo modificar.
- Mostrar solo el bloque relevante, no el archivo completo si es grande.
- Explicar el por qué de cada cambio no obvio.
- Después de cambios de estructura, recordar hacer restart del TS Server.
```

---

## 12. RESUMEN ULTRA-CORTO (para uso diario)

```
PROYECTO: Menesteres — sistema reservas clases cocina.
STACK: Next.js 15.5 App Router, React 19, TS, Tailwind 4, Supabase, Resend.
SUPABASE: rfpsqlqaqcwjzskkgril.supabase.co

ESTADO: Feature-complete. Pendiente: dominio real, deploy Vercel, email real admin.

TABLAS: classes (slug+date UNIQUE, is_cancelled), reservations (status: pending/confirmed/cancelled, idempotency_key UNIQUE).
VISTA: classes_with_availability (agrega available_spots).
RPC: create_reservation_atomic(p_class_id, p_customer_email, p_customer_name, p_customer_phone, p_idempotency_key, p_notes, p_spots) → {reservation_id, was_created, error_code}. ⚠️ No retorna datos completos — hacer query adicional.

AUTH: Magic Link Supabase. Middleware protege /admin/*. Allowlist en lib/admin/config.ts.
EMAILS: Resend sandbox. From: onboarding@resend.dev. Admin: lautarobarba1@gmail.com. 4 emails: reserva/admin/confirmada/cancelada.

RUTAS IMPORTANTES:
- POST /api/reservations → crear reserva pública
- POST /api/admin/reservations/[id] → {action: confirm|cancel}
- GET /api/admin/reservations/export → CSV con filtros
- POST /api/admin/classes → crear clase
- PATCH /api/admin/classes/[id] → editar clase
- POST /api/admin/classes/[id]/cancel → cancelar + cascada reservas
- GET /api/admin/classes/template?slug=X → plantilla por slug

PARA PRODUCCIÓN:
1. lib/resend/send.ts → from: "noreply@DOMINIO.com.ar"
2. lib/resend/send.ts → ADMIN_EMAIL = email real de la clienta
3. lib/admin/config.ts → agregar email de la clienta a allowlist
4. Supabase Auth → cambiar Site URL al dominio real
5. Vercel → cargar todas las env vars de .env.local
6. Supabase SQL → borrar clases seed del pasado

REGLAS CRÍTICAS:
- Server Components por defecto / "use client" solo con hooks
- Emails en try/catch que NO bloqueen el flujo
- No DELETE en clases — solo is_cancelled=true
- router.refresh() para refrescar tras mutaciones
- El form público manda name/email/phone — el endpoint normaliza a customerName/etc
```
