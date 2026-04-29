import type { StaticImageData } from "next/image";

import servicesAdultosFile from "../public/imagenes/imagen-c-2.jpeg";
import servicesNinosFile from "../public/imagenes/imagen-c1.jpeg";

function withAlt(image: StaticImageData, alt: string) {
  return { ...image, alt };
}

export const IMAGES = {
  hero: {
    src: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1400&q=90",
    alt: "Cocina profesional con ingredientes y utensilios sobre la mesa",
    /** Fondo en video (home hero); fallback a `src` si hay movimiento reducido. */
    videoSrc: "/imagenes/video-hero.mp4",
  },
  servicesAdultos: withAlt(
    servicesAdultosFile,
    "Personas en taller de cocina para adultos",
  ),
  servicesNinos: withAlt(
    servicesNinosFile,
    "Niños en una experiencia de cocina en grupo",
  ),
} as const;
