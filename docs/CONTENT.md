# Guía de contenido — Menesteres

Documento de referencia para actualizar textos del sitio. El código lee los valores publicados desde:

| Sección | Archivo en código |
|---------|-------------------|
| Contacto, mapa, redes | [`lib/site/contact.ts`](../lib/site/contact.ts) |
| Nosotros | [`lib/content/nosotros.ts`](../lib/content/nosotros.ts) |
| Alquiler del espacio | [`lib/espacio.ts`](../lib/espacio.ts) |

## Contacto y ubicación

| Campo | Valor actual | Acción |
|-------|--------------|--------|
| Email | `hola@menesteres.com` | Confirmar buzón activo |
| Dirección | San Martín 1234, Rafaela | Reemplazar por dirección real |
| WhatsApp | +54 9 341 555-0000 | Número real (`wa.me` sin + ni espacios) |
| Horarios | Martes a sábado · 10:00 – 20:00 | Ajustar según operación |
| Instagram / Facebook | Pendiente | Completar URLs en `lib/site/contact.ts` → `social` |
| Mapa | Google Maps (búsqueda por dirección) | Actualizar `map.embedUrl` si hay Place ID fijo |

## Nosotros

- **Entrevista** (`interview`): reemplazar con transcripción real de la fundadora.
- **Timeline** (`timeline`): validar año y texto de cada hito.
- **Estadísticas** (`stats`): verificar cifras antes de publicar; hoy son orientativas.
- **Reglas de la casa** (`houseRules`): confirmar con la chef.
- **Carta abierta** (`openLetter`): tono editorial final.

## Espacio (alquiler)

- **Ficha técnica** (`ESPACIO_SPECS`): metros, equipamiento y servicios reales.
- **Galería** (`ESPACIO_GALLERY`): rutas en `public/imagenes-menesteres/…`; agregar o quitar fotos según assets finales.
- **Copy de página** (`ESPACIO_INTRO` en `lib/espacio.ts`): párrafos hero de `/espacio`.

## Formularios

Las consultas de **Contacto** y **Alquiler del espacio** se guardan en Supabase (`inquiries`). Revisar la tabla desde el panel de Supabase o, en una fase posterior, desde el admin.

## Próxima fase operativa

Ver [`docs/NEXT-OPS.md`](./NEXT-OPS.md) para catálogo `/clases`, emails de reserva y lista de espera.
