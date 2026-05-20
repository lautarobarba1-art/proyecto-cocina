/**
 * Contenido de /espacio (alquiler).
 * Guía de actualización: docs/CONTENT.md
 */

export const ESPACIO_INTRO = {
  lead: "Estético por defecto: quien alquila se ahorra la escenografía. Cocina a la vista, luz honesta y silencio de fondo — para foto, video, talleres chicos o sesiones que piden rigor sin montar un set desde cero.",
  body: "Ficha técnica resumida y referencias visuales. Si tu proyecto necesita otra logística (horario extendido, catering externo, equipo extra), lo vemos en la consulta.",
} as const;

export interface EspacioSpec {
  label: string;
  value: string;
}

export const ESPACIO_SPECS: EspacioSpec[] = [
  {
    label: "Superficie",
    value: "~85 m² útiles · salón principal conectado a cocina a la vista",
  },
  {
    label: "Equipamiento",
    value: "Mesadas en acero inox, horno mixto, anafe a gas, heladera y freezer de trabajo",
  },
  {
    label: "Luz natural",
    value: "Ventanales NE; luz matinal estable para foto y video sin parches agresivos",
  },
  {
    label: "Capacidad",
    value: "Hasta 12 personas en mesa · ideal 4–8 para rodaje con movimiento de cámara",
  },
  {
    label: "Servicios",
    value: "Wi-Fi · café y agua · baño en planta · zona de carga discreta",
  },
];

export interface EspacioGalleryItem {
  src: string;
  alt: string;
  /** Clases de celda en la grilla 12 columnas. */
  gridClass: string;
}

export const ESPACIO_GALLERY: EspacioGalleryItem[] = [
  {
    src: "/imagenes-menesteres/imagenes-menesteres-webp/interior-local3.webp",
    alt: "Interior amplio con luz natural y mesa larga",
    gridClass: "col-span-12 aspect-[5/3] min-h-[220px] md:col-span-7 md:min-h-[280px] lg:min-h-[320px]",
  },
  {
    src: "/imagenes-menesteres/imagenes-menesteres-webp/interior-local10.webp",
    alt: "Cocina integrada con líneas limpias",
    gridClass: "col-span-12 aspect-[3/4] min-h-[240px] md:col-span-5 md:row-span-1 md:min-h-0 md:aspect-auto md:min-h-[280px] lg:min-h-[320px]",
  },
  {
    src: "/imagenes-menesteres/imagenes-menesteres-webp/interior-local1.webp",
    alt: "Detalle de mesada y grifería",
    gridClass:
      "col-span-12 aspect-square min-h-[180px] sm:col-span-6 sm:min-h-[200px] md:col-span-5 md:aspect-[4/5] md:min-h-[200px] lg:min-h-[240px]",
  },
  {
    src: "/imagenes-menesteres/imagenes-menesteres-webp/interior-local2.webp",
    alt: "Ambiente diáfano para producción",
    gridClass:
      "col-span-12 aspect-[4/5] min-h-[200px] sm:col-span-6 sm:min-h-[220px] md:col-span-7 md:aspect-[16/10] md:min-h-[200px] lg:min-h-[240px]",
  },
];
