"use client";

import * as React from "react";
import Image from "next/image";
import type { GaleriaItem, GaleriaGrid as GaleriaGridItems } from "@/lib/galeria";
    import { GaleriaLightbox } from "@/components/galeria/GaleriaLightbox";

interface GaleriaGridProps {
  items: typeof GaleriaGridItems;
};

/**
 * Patrón de 4 que alterna ancho/alto:
 *  0 → wide landscape  (col-span-2)
 *  1 → tall portrait   (col-span-1)
 *  2 → tall portrait   (col-span-1)
 *  3 → wide landscape  (col-span-2)
 */
function galeriaItemClass(index: number): string {
  switch (index % 4) {
    case 0:
    case 3:
      return "col-span-2 aspect-video";
    default:
      return "col-span-1 aspect-[2/3]";
  }
}

function GaleriaMedia({ item, booted, playing }: { item: GaleriaItem; booted: boolean; playing: boolean }) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  React.useEffect(() => {
    const v = videoRef.current;
    if (!v || !booted) return;
    if (playing) {
      void v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [booted, playing]);

  if (item.type === "video") {
    return (
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-snap group-hover:scale-[1.04]"
        muted
        loop
        playsInline
        src={booted ? item.src : undefined}
        aria-label={item.alt}
      />
    );
  }
  return (
    <Image
      src={item.src}
      alt={item.alt}
      fill
      sizes="(max-width: 768px) 50vw, 33vw"
      className="object-cover transition-transform duration-500 ease-snap group-hover:scale-[1.04]"
      style={{ objectPosition: item.objectPosition ?? "center" }}
    />
  );
}

export function GaleriaGrid({ items }: GaleriaGridProps) {
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);

  const sectionRef = React.useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = React.useState(false);
  const [booted, setBooted] = React.useState(false);

  React.useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        const hit = Boolean(e?.isIntersecting);
        setInView(hit);
        if (hit) setBooted(true);
      },
      { rootMargin: "80px 0px", threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (items.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="font-body text-[0.95rem] text-carbon/50">Próximamente.</p>
      </div>
    );
  }

  return (
    <>
      <div ref={sectionRef} data-inview={inView ? "true" : "false"} className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 border-y border-carbon/10">
        <div className="grid grid-cols-3 gap-0">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={[
                "group relative isolate overflow-hidden bg-carbon-soft cursor-pointer",
                galeriaItemClass(index),
              ].join(" ")}
              aria-label={`Ver: ${item.alt}`}
            >
              <GaleriaMedia item={item} booted={booted} playing={inView} />
              {item.title && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-carbon/80 to-transparent p-4 pt-10 opacity-0 transition-opacity duration-300 ease-snap group-hover:opacity-100">
                  <p className="font-mono text-[0.65rem] font-medium uppercase tracking-meta text-crema-light">
                    {item.title}
                  </p>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {selectedIndex !== null && (
        <GaleriaLightbox
          items={items}
          initialIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </>
  );
}