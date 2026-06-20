/**
 * Datos de contacto y ubicación — única fuente para Footer, Contacto, JSON-LD y mapa.
 * Actualizar aquí cuando el cliente confirme dirección, teléfono y redes.
 */

/** Búsqueda para mapa (embed y “Cómo llegar”). */
const MAP_DESTINATION = "Malvinas Argentinas 1150, Rafaela, Santa Fe, Argentina";

/**
 * URL para iframe: debe ser embed (`output=embed`), no goo.gl ni /maps/place/ (X-Frame-Options).
 */
const MAP_EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(MAP_DESTINATION)}&hl=es&z=16&output=embed`;

/** Enlace externo para abrir rutas en Google Maps (pestaña nueva). */
const MAP_DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(MAP_DESTINATION)}`;

export const siteContact = {
  email: "menesterescocina@gmail.com",
  address: {
    // TODO: confirmar dirección real con la clienta.
    // address.street = "Malvinas Argentinas 1150" pero map.directionsUrl apunta a "San Martín 1234".
    // Actualizar ambos (street, line, footerLines y directionsUrl) con la dirección confirmada.
    street: "Malvinas Argentinas 1150",
    locality: "Rafaela",
    region: "Santa Fe",
    country: "Argentina",
    countryCode: "AR",
    /** Una línea para bloques de contacto */
    line: "Malvinas Argentinas 1150 · Rafaela, Santa Fe · Argentina",
    /** Líneas para el footer */
    footerLines: ["Malvinas Argentinas 1150", "Rafaela, Santa Fe · AR"] as const,
  },
  hours: "Martes a sábado · 10:00 – 20:00",
  map: {
    /** Enlace "Cómo llegar" — abre Google Maps (no usable en iframe). */
    directionsUrl: MAP_DIRECTIONS_URL,
    /** iframe en ContactMap — solo URLs con `output=embed` o Maps Embed API. */
    embedUrl: MAP_EMBED_URL,
  },
  social: {
    /** null = enlace deshabilitado en footer hasta tener URL real */
    instagram: "https://www.instagram.com/menesteress",
  },
  /** Dominio canónico para schema.org (eventos, etc.) */
  siteUrl: "https://menesteres.ar",
} as const;

export function mailtoHref(): string {
  return `mailto:${siteContact.email}`;
}

export function postalAddressSchema(): {
  "@type": "PostalAddress";
  streetAddress: string;
  addressLocality: string;
  addressRegion: string;
  addressCountry: string;
} {
  return {
    "@type": "PostalAddress",
    streetAddress: siteContact.address.street,
    addressLocality: siteContact.address.locality,
    addressRegion: siteContact.address.region,
    addressCountry: siteContact.address.countryCode,
  };
}
