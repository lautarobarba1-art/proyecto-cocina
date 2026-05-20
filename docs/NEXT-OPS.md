# Fase operativa (pendiente)

Items acordados para después del lanzamiento de contenido y formularios.

## Catálogo `/clases`

- [`app/clases/page.tsx`](../app/clases/page.tsx): server-fetch con `getAllClasses()` y pasar props a [`ClassesCatalog`](../components/clases/ClassesCatalog.tsx).
- Honrar `?cat=` / `?categoria=` desde [`ServicesIndex`](../components/home/ServicesIndex.tsx).

## Reservas

- Emails de confirmación al cliente (Resend o similar) tras `POST /api/reservations`.
- Notificación al admin en reservas nuevas.
- Lista de espera real: tabla + API; reemplazar mock en [`WaitlistBlock`](../components/calendario/WaitlistBlock.tsx) y rama agotado en [`ClassReservationForm`](../components/clases/ClassReservationForm.tsx).

## Admin

- Filtros y búsqueda en [`app/admin/(protected)/reservas`](../app/admin/(protected)/reservas/page.tsx).
- Export CSV de reservas (mencionado en copy del dashboard).
- Vista de `inquiries` (contacto / espacio).

## Datos

- Sembrar clases en Supabase vía panel admin para calendario y detalle.
- Versionar migraciones en `supabase/migrations/`.

## Home

- Integrar [`NextClassTeaser`](../components/home/NextClassTeaser.tsx) con próxima clase desde DB.
