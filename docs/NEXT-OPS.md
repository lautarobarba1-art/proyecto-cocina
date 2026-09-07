# Fase operativa (pendiente)

Items acordados para después del lanzamiento de contenido y formularios.

## Catálogo `/clases`

- [`app/clases/page.tsx`](../app/clases/page.tsx): server-fetch con `getAllClasses()` y pasar props a [`ClassesCatalog`](../components/clases/ClassesCatalog.tsx).
- Honrar `?cat=` / `?categoria=` desde [`ServicesIndex`](../components/home/ServicesIndex.tsx).

## Reservas

- ~~Emails de confirmación al cliente tras `POST /api/reservations`.~~ Hecho.
- ~~Notificación al admin en reservas nuevas.~~ Hecho (`notifyAdminNewReservation`, requiere `ADMIN_EMAIL`).
- Lista de espera real: tabla + API; reemplazar mock en [`WaitlistBlock`](../components/calendario/WaitlistBlock.tsx) y rama agotado en [`ClassReservationForm`](../components/clases/ClassReservationForm.tsx).

## Admin

- ~~Filtros y búsqueda en `app/admin/(protected)/reservas`.~~ Hecho (estado, mes, comprobante sin revisar).
- ~~Export CSV de reservas.~~ Hecho.
- ~~Vista de `inquiries` (contacto / espacio).~~ Hecho — incluye aviso por email al admin en consultas nuevas.

## Datos

- Sembrar clases en Supabase vía panel admin para calendario y detalle.
- Versionar migraciones en `supabase/migrations/`.

## Home

- Integrar [`NextClassTeaser`](../components/home/NextClassTeaser.tsx) con próxima clase desde DB.
