export interface LookbookClip {
  id: string;
  title: string;
  description: string;
  src: string;
  posterSrc?: string;
}

export const LOOKBOOK_CLIPS: readonly LookbookClip[] = [
  {
    id: "clases",
    title: "Clases",
    description: "Talleres y prácticas en grupo, manos a la obra.",
    src: "/lookbook/video1.mp4",
  },
  {
    id: "local",
    title: "El local por dentro",
    description: "Mesas, hornos y la luz que entra al espacio.",
    src: "/lookbook/video2.mp4",
  },
  {
    id: "equipo",
    title: "Equipo",
    description: "Quienes hacen posible cada encuentro.",
    src: "/lookbook/video6.mp4",
  },
  {
    id: "mesa",
    title: "La mesa",
    description: "Compartir antes de servir.",
    src: "/lookbook/video4.mp4",
  },
  {
    id: "detalles",
    title: "Detalles",
    description: "Gestos chicos que definen el tono.",
    src: "/lookbook/video5.mp4",
  },
] as const;
