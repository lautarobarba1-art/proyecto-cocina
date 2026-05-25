"use client";

import * as React from "react";

import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { type LookbookItem, LOOKBOOK_ITEMS } from "@/lib/lookbook";
import Image from "next/image";

export interface LookbookProps {
  className?: string;
}

interface LookbookCellProps {
  item: LookbookItem;
  booted: boolean;
  playing: boolean;
  className: string;
}

function LookbookCell({ item, booted, playing, className }: LookbookCellProps) {
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

  return (
    <div
      className={[
        "group relative isolate min-w-0 overflow-hidden bg-transparent rounded-none border border-terracota-soft/25",
        className,
      ].join(" ")}
    >
      {item.type === "image" ? (
  <Image
    src={item.src}
    alt={item.description}
    fill
    sizes="(max-width: 768px) 50vw, 25vw"
    className="object-cover photo-editorial transition-transform duration-500 ease-snap group-hover:scale-[1.03]"
  />
) : (
  <video
    ref={videoRef}
    className="absolute inset-0 h-full w-full origin-center object-cover photo-editorial transition-[opacity,transform] duration-500 ease-snap will-change-transform group-hover:scale-[1.03]"
    muted
    loop
    playsInline
    preload="metadata"
    src={booted ? item.src : undefined}
    aria-label={item.description}
  />
)
}
</div>
  );
}
/** Layout editorial tablet/desktop para los primeros 5 clips (grid lg 4×2). */
const LOOKBOOK_LG_CLASSES: readonly string[] = [
  "aspect-4/3 min-h-[200px] border-b border-white/10 md:min-h-[220px] md:border-r md:border-white/10 lg:col-start-1 lg:row-start-1 lg:aspect-auto lg:h-full lg:min-h-0 lg:border-b lg:border-r",
  "aspect-4/3 min-h-[200px] border-b border-white/10 md:min-h-[220px] lg:col-start-1 lg:row-start-2 lg:aspect-auto lg:h-full lg:min-h-0 lg:border-r",
  "aspect-3/4 min-h-[220px] border-b border-white/10 md:min-h-[240px] md:border-r md:border-white/10 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:aspect-auto lg:min-h-0 lg:border-b-0 lg:border-r",
  "aspect-video min-h-[220px] border-b border-white/10 md:min-h-[240px] lg:col-start-3 lg:row-span-2 lg:row-start-1 lg:aspect-auto lg:min-h-0 lg:border-b-0 lg:border-r",
  "aspect-3/4 min-h-[220px] md:col-span-2 md:min-h-[260px] lg:col-span-1 lg:col-start-4 lg:row-span-2 lg:row-start-1 lg:aspect-auto lg:min-h-0",
] as const;

/**
 * max-md: bento 2×2 + fila ancha (cada 5) o último ancho si el ciclo queda incompleto.
 * md+: mantiene proporciones y grid editorial en lg.
 */
function lookbookCellClass(index: number, total: number): string {
  const pos = index % 5;
  const isLast = index === total - 1;
  const incompleteCycle = total % 5 !== 0;
  const wideMobile = pos === 4 || (isLast && incompleteCycle);

  const leftColSquare = pos % 2 === 0;
  const mobileBento = wideMobile
    ? "max-md:col-span-2 max-md:aspect-[2/1] max-md:w-full max-md:border-b max-md:border-white/10"
    : [
        "max-md:col-span-1 max-md:aspect-square max-md:min-h-0 max-md:border-b max-md:border-white/10",
        leftColSquare ? "max-md:border-r max-md:border-white/10" : "",
      ].join(" ");

  const fromMd =
    index < 5
      ? LOOKBOOK_LG_CLASSES[index]!
      : "min-h-[200px] border-b border-white/10 md:min-h-[240px] md:col-span-2 lg:col-span-2 lg:aspect-video lg:min-h-[min(36vh,320px)] lg:border-white/10";

  return [mobileBento, fromMd].join(" ");
}

export function Lookbook({ className }: LookbookProps) {
  const sectionRef = React.useRef<HTMLElement | null>(null);
  const [inView, setInView] = React.useState<boolean>(false);
  const [booted, setBooted] = React.useState<boolean>(false);
  const total = LOOKBOOK_ITEMS.length;
  const lgMultiBlock = total > 5;

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

  return (
    <section
      ref={sectionRef}
      className={[
        "overflow-x-clip border-t border-crema-light/10 bg-terracota-soft py-20 text-crema-light lg:py-28",
        className ?? "",
      ].join(" ")}
      aria-label="Lookbook en video"
    >
      <Container as="div" className="mb-10 lg:mb-12">
        <p className="font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow text-terracota-deep/90">
          #MENESTERES
        </p>
        <h2 className="mt-3 max-w-[min(100%,20ch)] text-balance font-display text-3xl font-normal leading-[1.02] tracking-tightish text-crema-light sm:text-4xl md:text-5xl lg:text-6xl">
          Un espacio de <em className="italic text-terracota-deep">inspiración</em>
        </h2>
        <p className="mt-5 max-w-[48ch] font-body text-[1rem] leading-[1.65] text-crema-light/75">
          Clases, el local, el equipo y el ritmo de la cocina — en cinco tomas que se leen de un solo vistazo.
        </p>
      </Container>

      <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 border-y border-white/10">
        <div
          className={[
            "mx-auto grid min-w-0 max-w-[1600px] grid-cols-2 max-md:gap-0 max-md:border-x max-md:border-white/10 md:auto-rows-fr md:gap-0",
            "md:grid-cols-2",
            lgMultiBlock ? "lg:grid-rows-none lg:auto-rows-fr" : "lg:grid-rows-2",
            "lg:min-h-[min(62vh,720px)] lg:grid-cols-4 lg:gap-0",
          ].join(" ")}
        >
          {LOOKBOOK_ITEMS.map((item, index) => (
            <LookbookCell
              key={item.id}
              item={item}
              booted={booted}
              playing={inView}
              className={lookbookCellClass(index, total)}
            />
          ))}
        </div>
      </div>

      <Container as="div" className="mt-10 flex justify-center lg:mt-12">
        <Button href="/galeria" variant="outline-cream">
          Descúbrelo
        </Button>
      </Container>
    </section>
  );
}
