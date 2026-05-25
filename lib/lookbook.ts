export interface LookbookItem {
  id: string;
  title: string;
  description: string;
  src: string;
  posterSrc?: string;
  type: "video" | "image";
}

export const LOOKBOOK_ITEMS: readonly LookbookItem[] = [
  {
    id: "clases",
    title: "Clases",
    description: "Talleres y prácticas en grupo, manos a la obra.",
    src: "/lookbook/video1.1_compressed.mp4",
    type: "video",
  },
  {
    id: "local",
    title: "El local por dentro",
    description: "Mesas, hornos y la luz que entra al espacio.",
    src: "/lookbook/imagen_logo.webp",
    type: "image",
  },
  {
    id: "equipo",
    title: "Equipo",
    description: "Quienes hacen posible cada encuentro.",
    src: "/lookbook/mane-food-b_w.webp",
    type: "image",
  },
  {
    id: "mesa",
    title: "La mesa",
    description: "Compartir antes de servir.",
    src: "/lookbook/video4_compressed.mp4",
    type: "video",
  },
  {
    id: "detalles",
    title: "Detalles",
    description: "Gestos chicos que definen el tono.",
    src: "/lookbook/video5_compressed.mp4",
    type: "video",
  },
] as const;
