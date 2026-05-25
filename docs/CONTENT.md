# Guía de contenido — Menesteres

Documento de referencia para actualizar textos del sitio. El código lee los valores publicados desde:

| Sección | Archivo en código |
|---------|-------------------|
| Contacto, mapa, redes | [`lib/site/contact.ts`](../lib/site/contact.ts) |
| Nosotros | [`lib/content/nosotros.ts`](../lib/content/nosotros.ts) |
| Alquiler del espacio | [`lib/espacio.ts`](../lib/espacio.ts) |

## Contacto y ubicación

| Campo | Valor actual en código | Acción |
|-------|------------------------|--------|
| Email | `hola@menesteres.com` | Confirmar buzón activo |
| Dirección (`address.street`) | `Malvinas Argentinas 1150, Rafaela` | **⚠️ Confirmar con la clienta** — el mapa apunta a "San Martín 1234" |
| URL de mapa (`map.directionsUrl`) | Apunta a `San Martín 1234` | Actualizar cuando se confirme la dirección real |
| WhatsApp | `+54 9 349 269-4750` | Confirmar número real |
| Horarios | Martes a sábado · 10:00 – 20:00 | Ajustar según operación |
| Instagram / Facebook | `null` (deshabilitado) | Completar URLs en `lib/site/contact.ts` → `social` |
| Mapa embed | `maps.app.goo.gl/iycWJq9H2mnyQkuW6` | Reemplazar con Place ID fijo una vez confirmada la dirección |

### Cómo actualizar la dirección

Cuando la clienta confirme la dirección real, editar en `lib/site/contact.ts`:
1. `address.street` → dirección confirmada
2. `address.line` → versión de una línea
3. `address.footerLines` → dos líneas para el footer
4. `map.directionsUrl` → URL de Google Maps con la dirección correcta
5. `map.embedUrl` → URL del iframe embed (Place ID si disponible)

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

Las consultas de **Contacto** y **Alquiler del espacio** se guardan en Supabase (`inquiries`).
Se leen desde el panel en `/admin/inquiries`.
