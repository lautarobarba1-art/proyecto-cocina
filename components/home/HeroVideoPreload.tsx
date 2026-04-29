import { preload } from "react-dom";

import { IMAGES } from "@/lib/images";

/**
 * Precarga el hero en video en el servidor (home) para que el fetch arranque
 * en paralelo al HTML y no quede relegado tras la intro.
 */
export function HeroVideoPreload() {
  preload(IMAGES.hero.videoSrc, {
    as: "video",
    type: "video/mp4",
    fetchPriority: "high",
  });
  return null;
}
