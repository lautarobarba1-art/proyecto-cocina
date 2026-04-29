import Image from "next/image";

import { ESPACIO_GALLERY } from "@/lib/espacio";

export interface EspacioGalleryProps {
  className?: string;
}

export function EspacioGallery({ className }: EspacioGalleryProps) {
  return (
    <div className={["min-w-0", className ?? ""].join(" ")}>
      <p className="font-mono text-[0.65rem] font-medium uppercase tracking-eyebrow text-terracota">
        Ambiente
      </p>
      <div className="mt-8 grid min-w-0 grid-cols-12 gap-2 sm:gap-3 lg:gap-4">
        {ESPACIO_GALLERY.map((item) => (
          <div
            key={item.src}
            className={["relative isolate min-h-0 overflow-hidden bg-carbon-soft/15", item.gridClass].join(" ")}
          >
            <Image
              src={item.src}
              alt={item.alt}
              fill
              sizes="(max-width: 768px) 100vw, 60vw"
              className="object-cover photo-editorial"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
