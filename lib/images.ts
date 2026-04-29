import type { StaticImageData } from "next/image";

import servicesAdultosFile from "../public/imagenes/imagen-c-2.jpeg";
import servicesNinosFile from "../public/imagenes/imagen-c1.jpeg";

function withAlt(image: StaticImageData, alt: string) {
  return { ...image, alt };
}

export const IMAGES = {
  hero: {
    /** Fondo en video (home hero). */
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
