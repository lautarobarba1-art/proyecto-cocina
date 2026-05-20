/**
 * Datos de contacto y ubicación — única fuente para Footer, Contacto, JSON-LD y mapa.
 * Actualizar aquí cuando el cliente confirme dirección, teléfono y redes.
 */

export const siteContact = {
  email: "hola@menesteres.com",
  phone: {
    display: "+54 9 349 269-4750",
    /** Número para wa.me: solo dígitos, con código país, sin + */
    waMe: "3492694750",
  },
  address: {
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
  hours: "Martes a sábado · 10:00 – 20:00 (consultar por WhatsApp)",
  map: {
    /** Enlace “Cómo llegar” en Google Maps */
    directionsUrl:
      "https://www.google.com/maps/search/?api=1&query=San+Mart%C3%ADn+1234%2C+Rafaela%2C+Santa+Fe%2C+Argentina",
    /**
     * iframe embed por búsqueda de dirección. Reemplazar con Place ID cuando exista ubicación fija.
     */
    embedUrl:
      "https://maps.app.goo.gl/iycWJq9H2mnyQkuW6",
  },
  social: {
    /** null = enlace deshabilitado en footer hasta tener URL real */
    instagram: null as string | null,
    facebook: null as string | null,
    whatsapp: "https://wa.me/3492694750",
  },
  /** Dominio canónico para schema.org (eventos, etc.) */
  siteUrl: "https://menesteres.com",
} as const;

export function mailtoHref(): string {
  return `mailto:${siteContact.email}`;
}

export function whatsappHref(): string {
  return `https://wa.me/${siteContact.phone.waMe}`;
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
