# MENESTERES — CONTEXTO MODULAR

Cada módulo es independiente. Usá solo el que necesitás.

---

## MÓDULO 1: FRONTEND / UI

### Archivos involucrados
```
app/layout.tsx                    # Layout raíz — Navbar global + providers
app/page.tsx                      # Landing pública
components/layout/Navbar.tsx      # Navbar del sitio público
components/ui/Button.tsx          # Botón reutilizable (variant: primary|ghost|outline)
components/ui/form.tsx            # Field, FormInput, FormSelect, FormTextarea, FormError
components/ui/HoneypotField.tsx   # Campo trampa anti-bot
next.config.ts                    # remotePatterns para imágenes externas
tailwind.config.ts                # Design system + tokens
```

### Cómo funciona
- Server Components por defecto. `"use client"` solo donde hay estado o browser APIs.
- Tailwind 4 con design system custom definido en `tailwind.config.ts`.
- Imágenes via `next/image` con URLs externas (Unsplash, Imgur). Dominios permitidos en `next.config.ts`.
- Componentes de UI sin lógica de negocio — solo presentación.

### Design system (tokens)
```
Colores:   terracota, terracota-deep, crema, crema-light, crema-deep, carbon
Fuentes:   font-display (headings), font-body (texto), font-mono (labels), font-sans (UI)
Tracking:  tracking-eyebrow (labels de sección en mayúsculas)
Sombras:   shadow-brand-lg
```

### Dependencias
- `tailwind.config.ts` define todos los tokens — si se rompe, todo el diseño se rompe.
- `next.config.ts` necesita tener el dominio de cualquier imagen externa antes de usarla.

### Reglas importantes
- Nunca usar colores hardcoded (`text-red-500`). Siempre usar tokens del design system.
- Nunca importar desde `lib/supabase/server.ts` en un Client Component — explota en runtime.
- Sub-componentes simples van en el mismo archivo si solo se usan ahí.

### NO romper
- Los tokens de color y tipografía de `tailwind.config.ts`.
- El `app/layout.tsx` — el Navbar global está ahí y afecta todo el sitio público.
- El `next.config.ts` — sin `remotePatterns`, las imágenes de clases fallan.

---

## MÓDULO 2: BACKEND / API

### Archivos involucrados
```
app/api/reservations/route.ts              # POST — crear reserva pública
app/api/admin/reservations/[id]/route.ts   # POST — confirm|cancel reserva
app/api/admin/reservations/export/route.ts # GET — exportar CSV
app/api/admin/classes/route.ts             # POST — crear clase
app/api/admin/classes/[id]/route.ts        # PATCH — editar clase
app/api/admin/classes/[id]/cancel/route.ts # POST — cancelar clase + cascada
app/api/admin/classes/template/route.ts    # GET — plantilla por slug
lib/supabase/server.ts                     # getSupabaseAdmin() — singleton service role
```

### Cómo funciona
- Todos los endpoints son Route Handlers de Next.js App Router.
- `export const runtime = "nodejs"` en todos (necesario para Supabase + Resend).
- Patrón estándar de cada endpoint:
  1. Verificar auth (solo endpoints admin).
  2. Parsear body en try/catch.
  3. Validar campos.
  4. Ejecutar operación en Supabase.
  5. Enviar emails si corresponde (en try/catch separado).
  6. Retornar `NextResponse.json()`.

### Endpoint crítico: POST /api/reservations
```
Recibe:  {classId, name, email, phone, notes, spots, idempotencyKey, honeypot}
Proceso:
  1. Normaliza name→customerName, email→customerEmail, phone→customerPhone
  2. Llama create_reservation_atomic() con p_idempotency_key
  3. RPC retorna solo {reservation_id} — hace query adicional para obtener datos completos
  4. Envía 2 emails (cliente + admin) en try/catch
Retorna: {ok: true, id: reservation_id}
Errores: not_available (sin cupos), duplicate (idempotency), server_error
```

### Dependencias
- `lib/supabase/server.ts` → `getSupabaseAdmin()` — todos los endpoints lo usan.
- `lib/supabase/auth-server.ts` → `getCurrentUserEmail()` — endpoints admin.
- `lib/admin/config.ts` → `isAdminEmail()` — endpoints admin.
- `lib/resend/send.ts` → funciones de email — endpoints que mutan estado.

### Reglas importantes
- **Siempre** `export const runtime = "nodejs"`.
- Auth check al inicio de cada endpoint admin — antes de cualquier otra operación.
- Body parse en try/catch — sin esto, un JSON malformado tira 500.
- Emails NUNCA bloquean la respuesta — siempre en try/catch separado.
- `create_reservation_atomic` requiere `p_idempotency_key` — sin él, el RPC falla con PGRST202.

### NO romper
- La normalización de campos en `/api/reservations` (`name→customerName`, etc.) — el form público los manda así.
- El try/catch de emails — si se saca, un fallo de Resend mata la reserva.
- El `runtime = "nodejs"` — sin esto, el edge runtime no tiene acceso a ciertas APIs.

---

## MÓDULO 3: BASE DE DATOS

### Supabase Project
```
URL:  https://rfpsqlqaqcwjzskkgril.supabase.co
Ref:  rfpsqlqaqcwjzskkgril
```

### Schema

#### Tabla `classes`
```sql
id              uuid PK DEFAULT gen_random_uuid()
slug            text NOT NULL
date            date NOT NULL
title           text NOT NULL
start_time      time NOT NULL
end_time        time NOT NULL
category_event  text NOT NULL  -- 'adultos' | 'ninos' | 'eventos'
short_desc      text
is_highlighted  boolean DEFAULT false
category_label  text
description_long text
duration_label  text
image_src       text           -- URL externa (Unsplash/Imgur)
image_alt       text
total_spots     int NOT NULL
price           numeric(10,2)
payment_link    text           -- URL Mercado Pago
is_cancelled    boolean DEFAULT false
UNIQUE(slug, date)
```

#### Tabla `reservations`
```sql
id              uuid PK DEFAULT gen_random_uuid()
class_id        uuid REFERENCES classes(id)
customer_name   text NOT NULL
customer_email  text NOT NULL
customer_phone  text
notes           text
spots           int NOT NULL DEFAULT 1
status          text DEFAULT 'pending'  -- 'pending'|'confirmed'|'cancelled'
idempotency_key uuid UNIQUE
created_at      timestamptz DEFAULT now()
confirmed_at    timestamptz
cancelled_at    timestamptz
```

#### Vista `classes_with_availability`
```sql
-- Calcula available_spots = total_spots - SUM(spots) WHERE status IN ('pending','confirmed')
-- Las reservas canceladas NO consumen cupos
-- Usada en el calendario público
```

#### Función `create_reservation_atomic`
```sql
-- Firma exacta (el orden importa para PostgREST):
create_reservation_atomic(
  p_class_id        uuid,
  p_customer_email  text,
  p_customer_name   text,
  p_customer_phone  text,
  p_idempotency_key uuid,
  p_notes           text,
  p_spots           int
)
RETURNS TABLE(reservation_id uuid, was_created boolean, error_code text)

-- Lógica interna:
-- 1. SELECT FOR UPDATE en la clase (lock)
-- 2. Verifica available_spots >= p_spots
-- 3. INSERT en reservations
-- 4. Retorna {reservation_id, was_created: true, error_code: null}
-- ⚠️ NO retorna datos del cliente — hacer query adicional post-RPC
```

### RLS
```
classes:      SELECT público. INSERT/UPDATE/DELETE solo service_role.
reservations: Todo solo service_role (anon no puede leer ni escribir).
```

### Queries importantes

```sql
-- Cupos disponibles de una clase
SELECT available_spots FROM classes_with_availability WHERE id = $1;

-- Reservas activas de una clase (para panel admin)
SELECT COUNT(*) FROM reservations
WHERE class_id = $1 AND status IN ('pending', 'confirmed');

-- Cancelar clase en cascada
UPDATE classes SET is_cancelled = true WHERE id = $1;
UPDATE reservations SET status = 'cancelled', cancelled_at = now()
WHERE class_id = $1 AND status IN ('pending', 'confirmed');
```

### Reglas de negocio
- Una clase NO se borra — solo `is_cancelled = true` (FK de reservas lo impide).
- Cupos = solo `pending` + `confirmed`. Los `cancelled` se liberan automáticamente.
- Un cliente puede tener múltiples reservas para distintas clases.
- `idempotency_key` evita crear dos reservas del mismo submit.
- `slug + date` son únicos — misma clase puede repetirse en distintas fechas.

### NO romper
- El constraint `UNIQUE(slug, date)` — es intencional.
- La función RPC — no modificar su firma sin actualizar todos los endpoints que la llaman.
- La vista `classes_with_availability` — es la fuente de verdad de cupos.
- Los valores de `status` — siempre 'pending', 'confirmed', 'cancelled' (lowercase).

---

## MÓDULO 4: AUTENTICACIÓN

### Archivos involucrados
```
middleware.ts                       # Intercepta /admin/* — verifica sesión
lib/supabase/browser.ts             # createBrowserClient() para Client Components
lib/supabase/auth-server.ts         # getCurrentUserEmail() para Server Components
lib/supabase/server.ts              # getSupabaseAdmin() — service role (NO es auth)
lib/admin/config.ts                 # ADMIN_ALLOWLIST = ['lautarobarba1@gmail.com']
app/admin/login/page.tsx            # Página de login (Server)
app/admin/login/LoginForm.tsx       # Form de magic link (Client)
app/admin/auth/callback/route.ts    # Callback OAuth — intercambia code por sesión
app/admin/LogoutButton.tsx          # Botón logout (Client)
app/admin/(protected)/layout.tsx    # Layout admin — verifica auth server-side
```

### Cómo funciona
```
1. Admin visita /admin/[cualquier-ruta]
2. middleware.ts intercepta → verifica cookie de sesión Supabase
3. Si no hay sesión → redirect a /admin/login
4. En /admin/login → LoginForm pide email → llama supabase.auth.signInWithOtp()
5. Supabase envía Magic Link al email
6. Admin hace click → llega a /admin/auth/callback?code=XXX
7. Callback intercambia code por sesión → cookie → redirect a /admin
8. Layout (protected)/layout.tsx verifica email en allowlist → si no → redirect login
9. Cada endpoint admin también verifica: getCurrentUserEmail() + isAdminEmail()
```

### Doble protección
- **Middleware:** protege rutas de página (no puede ver el HTML).
- **Endpoints:** verifican auth independientemente (no confían en el middleware).

### Rate limit Supabase Auth (sandbox)
- ~4 magic links por hora por IP. En producción es más permisivo.

### Para agregar un admin
```typescript
// lib/admin/config.ts
export const ADMIN_ALLOWLIST = [
  'lautarobarba1@gmail.com',
  'nuevo-admin@dominio.com',  // agregar acá
];
```

### Para producción
- Cambiar `Site URL` en Supabase Auth → URL Configuration al dominio real.
- Sin esto, el Magic Link redirige a localhost.

### NO romper
- La ruta `/admin/auth/callback` — si se mueve o renombra, el Magic Link deja de funcionar.
- La estructura `(protected)` — el Route Group mantiene `/admin/login` fuera del layout admin.
- El middleware — sin él, todas las rutas `/admin` son públicas.
- La doble verificación — no eliminar el auth check de los endpoints aunque el middleware exista.

---

## MÓDULO 5: CALENDARIO Y RESERVAS

### Archivos involucrados
```
app/calendario/page.tsx              # Calendario público (Server Component)
app/clases/[slug]/page.tsx           # Ficha de clase + form de reserva (Server)
components/ui/ClassReservationForm.tsx  # Form de reserva interactivo (Client)
app/api/reservations/route.ts        # Endpoint crear reserva
lib/supabase/server.ts               # getSupabaseAdmin() para queries
```

### Flujo completo de reserva
```
1. Usuario ve /calendario → clases traídas de classes_with_availability
2. Click en clase → /clases/[slug]?fecha=YYYY-MM-DD
3. Server Component carga datos de la clase + sesiones disponibles
4. ClassReservationForm renderiza:
   - Si classItem.status === 'agotado' → modo waitlist (sin endpoint real aún)
   - Si hay sesiones → form de reserva real
5. Submit → fetch POST /api/reservations con:
   {classId, name, email, phone, notes, spots, idempotencyKey, honeypot}
6. Endpoint normaliza → llama RPC → query adicional → emails → {ok: true}
7. Form muestra pantalla de éxito
```

### SessionOption (interfaz clave)
```typescript
interface SessionOption {
  id: string;       // ID de la sesión (puede ser el classId)
  label: string;    // Texto del dropdown "Sábado 17 de mayo - 18:00"
  classId?: string; // UUID de la clase en Supabase (el que va al RPC)
  date?: string;    // YYYY-MM-DD
}
```

### El form manda vs el endpoint espera
```
FORM MANDA:     name, email, phone, spots, notes, classId, idempotencyKey, honeypot
ENDPOINT RECIBE: normaliza a customerName, customerEmail, customerPhone
RPC ESPERA:     p_customer_name, p_customer_email, p_customer_phone
```

### Idempotencia
- `idempotencyKey` se genera con `crypto.randomUUID()` al montar el form.
- Si el usuario hace submit dos veces, el segundo falla silenciosamente (la reserva ya existe).
- La `idempotency_key` es `UNIQUE` en DB — constraint a nivel Postgres.

### Honeypot
- Campo invisible para humanos, bots lo llenan.
- Si `honeypot` tiene valor → endpoint retorna 200 silencioso sin crear nada.

### NO romper
- La interfaz `SessionOption` — el form depende de `classId` para saber qué mandar al endpoint.
- La normalización de campos en el endpoint — el form histórico manda `name/email/phone`.
- El `idempotencyKey` en el RPC call — sin `p_idempotency_key`, el RPC falla.
- La query adicional post-RPC — el RPC no retorna datos del cliente.

---

## MÓDULO 6: PAGOS

### Estado actual
**Sin integración de pagos implementada.** El sistema actual es:
1. Cliente reserva → recibe email con link de MercadoPago (si la clase tiene `payment_link`).
2. Admin verifica pago manualmente → marca "Pagada" en el panel.
3. Cliente recibe email de confirmación.

### Archivos involucrados
```
classes.payment_link               # Campo en DB — URL de MP para esa clase
lib/resend/templates.ts            # templateReservaConfirmacion() incluye botón de pago
app/admin/(protected)/clases/ClaseFormCliente.tsx  # Campo "Link de Mercado Pago" en el form
```

### Cómo funciona ahora
```
1. Admin crea clase con payment_link = "https://mpago.la/..."
2. Cliente reserva → email de confirmación incluye botón "Pagar seña" si payment_link existe
3. Cliente paga en MP externamente
4. Admin ve el pago en su cuenta de MP
5. Admin va al panel → marca reserva como "Pagada"
6. Sistema envía email de confirmación al cliente
```

### Para implementar pagos reales (futuro)
- Integrar Mercado Pago Checkout Pro o Preferencias.
- Webhook de MP para auto-confirmar reservas al recibir pago.
- Riesgo técnico: medio (requiere backend para webhooks + manejo de estados).

### NO romper
- El campo `payment_link` en la tabla `classes` — es opcional, no forzar.
- La lógica condicional en el template de email — si no hay `payment_link`, no muestra el botón.

---

## MÓDULO 7: EMAILS

### Archivos involucrados
```
lib/resend/client.ts      # Instancia Resend — singleton
lib/resend/templates.ts   # HTML templates de los 4 emails
lib/resend/send.ts        # 4 funciones de envío
```

### Configuración actual (sandbox)
```typescript
// lib/resend/send.ts
const ADMIN_EMAIL = "lautarobarba1@gmail.com";

// En todas las funciones de envío:
from: "onboarding@resend.dev"  // dominio sandbox de Resend
```

### Los 4 emails

| Función | Cuándo | Para quién | Subject |
|---|---|---|---|
| `sendEmailReservaConfirmacion()` | Cliente hace reserva | Cliente | `✓ Reserva confirmada: [clase]` |
| `sendEmailAdminNewReserva()` | Cliente hace reserva | Admin | `📬 Nueva reserva: [nombre]` |
| `sendEmailReservaConfirmada()` | Admin marca pagada | Cliente | `✓ Pago confirmado: [clase]` |
| `sendEmailReservaCancelada()` | Admin cancela reserva | Cliente | `Reserva cancelada: [clase]` |

### Dónde se invocan
```
sendEmailReservaConfirmacion + sendEmailAdminNewReserva
  → app/api/reservations/route.ts (tras crear reserva pública)

sendEmailReservaConfirmada
  → app/api/admin/reservations/[id]/route.ts (action: "confirm")

sendEmailReservaCancelada
  → app/api/admin/reservations/[id]/route.ts (action: "cancel")
```

### Patrón de envío (siempre igual)
```typescript
try {
  const { sendEmailXxx } = await import("@/lib/resend/send");
  await sendEmailXxx(...);
} catch (emailErr) {
  console.error("[endpoint] Email error:", emailErr);
  // NO retornar error — la operación principal ya completó
}
```

### Para producción (cuando tengas dominio)
```typescript
// lib/resend/send.ts — cambiar en TODAS las funciones:
from: "noreply@TU-DOMINIO.com.ar"  // reemplaza onboarding@resend.dev

// Cambiar también:
const ADMIN_EMAIL = "email-real-de-la-clienta@gmail.com";
```

### Variables de entorno
```
RESEND_API_KEY=re_xxxxxxxxxxxx  # En .env.local
```

### Sandbox Resend
- En sandbox, todos los emails llegan SOLO al email registrado en tu cuenta Resend.
- Los emails se ven en https://resend.com/emails con status sent/delivered/bounced.

### NO romper
- El try/catch alrededor de cada llamada de email — sin esto, un fallo de Resend mata la operación.
- El import dinámico `await import("@/lib/resend/send")` — evita problemas de módulo en edge.
- La firma de cada función en `send.ts` — los endpoints los llaman con parámetros posicionales.

---

## MÓDULO 8: PANEL ADMIN

### Archivos involucrados
```
middleware.ts                                    # Guard de rutas /admin/*
app/admin/(protected)/layout.tsx                 # Layout admin (fixed, z-9999)
app/admin/(protected)/page.tsx                   # Dashboard con cards
app/admin/(protected)/reservas/
  ├── page.tsx                                   # Listado + filtros + pills
  ├── ReservaActions.tsx                         # Botones pagada/cancelar (Client)
  └── FiltroMesForm.tsx                          # Select de mes con router.push (Client)
app/admin/(protected)/clases/
  ├── page.tsx                                   # Listado clases con toggle
  ├── ClasesActions.tsx                          # Botón cancelar clase (Client)
  ├── ClaseFormCliente.tsx                       # Form crear/editar (Client, 7 secciones)
  ├── nueva/page.tsx                             # Página crear clase
  └── [id]/page.tsx                              # Página editar clase
lib/admin/
  ├── config.ts                                  # ADMIN_ALLOWLIST
  ├── reservas-queries.ts                        # getReservasForAdmin(), reservasToCSV()
  ├── clases-queries.ts                          # getClasesForAdmin(), countActiveReservations()
  └── clases-validation.ts                       # slugFromTitle(), validateClaseForm(), getTemplateBySlug()
```

### Layout admin — detalle crítico
```typescript
// app/admin/(protected)/layout.tsx
// className="fixed inset-0 z-[9999] overflow-y-auto bg-crema"
// Tapa el Navbar global del sitio público SIN modificar app/layout.tsx
// Verifica auth server-side — si no es admin, redirect a /admin/login
```

### Panel Reservas
```
Filtros disponibles:
  - Estado: Todos | Pendientes | Pagadas | Canceladas (via ?estado= en URL)
  - Mes de la clase: select con últimos 12 meses (via ?mes=YYYY-MM en URL)
  - Combinables: ?estado=pending&mes=2026-05

Totales: pills dinámicos (cuentan el resultado filtrado, no el total global)

Acciones por reserva:
  - "Marcar pagada" → solo si status=pending → POST /api/admin/reservations/[id] {action:"confirm"}
  - "Cancelar" → si no está cancelled → POST {action:"cancel"}
  - Ambas mandan email al cliente

Export CSV:
  - Link <a href="/api/admin/reservations/export?{params}"> con download
  - Respeta los filtros activos
  - Formato: fecha,nombre,email,tel,clase,fecha-clase,horario,cupos,estado,notas
```

### Panel Clases
```
Filtros:
  - Toggle: "Solo próximas" | "Todas" (via ?filtro= en URL)

Badges de estado por clase:
  - Disponible (verde)
  - Pocos cupos (amarillo, < 30% disponible)
  - Llena (rojo, 0 cupos)
  - Pasada (gris, fecha anterior a hoy)
  - Cancelada (gris oscuro, is_cancelled=true)

Acciones:
  - "+ Nueva clase" → /admin/clases/nueva
  - Click en título → /admin/clases/[id] (editar)
  - "Cancelar clase" → POST /api/admin/classes/[id]/cancel
    → Marca is_cancelled=true en clase
    → Cancela TODAS las reservas pending+confirmed en cascada
    → No aparece en clases pasadas (isPast=true)
```

### Form de clase (ClaseFormCliente)
```
Secciones: Identificación | Fecha y horario | Categorías | Descripciones | Imagen | Cupos y precio | Visibilidad

Slug:
  - Se auto-genera desde el título (slugFromTitle)
  - Si el admin lo edita manualmente → deja de auto-generarse
  - En modo editar → siempre editable manualmente

Plantilla por slug (solo en crear):
  - Admin escribe título → slug se genera
  - Botón "Cargar plantilla por slug" → GET /api/admin/classes/template?slug=X
  - Autocompleta todos los campos comunes excepto fecha/hora/precio

Validación:
  - Client-side: validateClaseForm() en el submit
  - Server-side: mismo validateClaseForm() en el endpoint
  - Unicidad slug+date: constraint Postgres (error 23505 → mensaje específico)
```

### Queries del panel admin
```typescript
// Reservas con filtros
getReservasForAdmin(limit: 200, filter: {status?, mes?})
// Filtra status en Supabase, filtra mes en JS post-query (por limitación de FK)

// Clases con filtros
getClasesForAdmin({onlyUpcoming?: boolean})

// Cupos activos de una clase
countActiveReservations(classId: string): Promise<number>
// COUNT WHERE status IN ('pending', 'confirmed')
```

### NO romper
- El Route Group `(protected)` — es lo que diferencia `/admin/login` del layout admin.
- El `fixed inset-0 z-[9999]` en el layout admin — sin esto, el Navbar global tapa el panel.
- La lógica de cancelación en cascada — si se modifica, puede dejar reservas huérfanas.
- El `router.refresh()` en ReservaActions y ClasesActions — sin esto, la tabla no se actualiza.
- El filtro de mes en JS post-query — si se elimina, el filtro por mes no funciona correctamente.
```
