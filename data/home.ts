export const FILOSOFIA_COPY = {
  parrafo: `En Menesteres creemos que la cocina no es trabajo:
es una manera de dar amor. Nacimos con una idea clara —
crear un espacio donde cocinar sea encuentro, celebración,
emoción compartida. Porque una mesa no es solo un lugar
donde se come: es donde se une la familia, se abrazan
amigos, se celebran parejas y se construyen recuerdos.`,
  cierre: 'Menesteres significa "todo lo que necesitás".',
};

export const CLASES_COPY = {
  label: "CLASES" as const,
  headline: "Cada mes, una excusa para cocinar con otros.",
  descripcion: `Talleres para adultos, propuestas para niños
y fechas que se renuevan cada mes. Grupos chicos,
ambiente cálido, aprendizaje real.`,
  tags: ["Adultos", "Niños", "Grupos chicos", "Fechas mensuales"],
  ctaPrimario: { texto: "Ver próximas clases", href: "/clases" },
  ctaSecundario: { texto: "Ver calendario →", href: "/clases#calendario" },
};

export const SERVICIOS_COPY = {
  eventos: {
    label: "EVENTOS PRIVADOS" as const,
    headline: "Para lo que merece algo propio.",
    descripcion: `Cumpleaños, equipos de trabajo, celebraciones
a medida. Lo coordinamos con vos, respuesta en 24-48 hs.`,
    detalle: "Grupos chicos · Menú a medida · Coordinación incluida",
    cta: { texto: "Consultar disponibilidad", href: "/contacto?tipo=evento" },
  },
  alquiler: {
    label: "ALQUILER DEL ESPACIO" as const,
    headline: "Un espacio hecho para producir.",
    descripcion: `Para fotógrafos, talleristas y pequeñas
producciones. Cocina equipada, luz natural, ambiente único.`,
    detalle: "Cocina equipada · Luz natural · Consultar m² y tarifas",
    cta: { texto: "Ver el espacio", href: "/contacto?tipo=alquiler" },
  },
};
