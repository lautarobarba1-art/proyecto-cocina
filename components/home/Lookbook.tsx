"use client";

import * as React from "react";

import { Reveal, RevealItem, RevealStagger } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { type LookbookItem, LOOKBOOK_ITEMS } from "@/lib/lookbook";
import { REVEAL } from "@/lib/motion";
import Image from "next/image";

export interface LookbookProps {
  className?: string;
}

interface LookbookCellProps {
  item: LookbookItem;
  booted: boolean;
  playing: boolean;
  className: string;
  index: number;
}

function LookbookCell({ item, booted, playing, className, index }: LookbookCellProps) {
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
    <Reveal
      variant="scaleIn"
      delay={(index % 5) * 0.07}
      duration={REVEAL.durationImage}
      margin="-8% 0px"
      className={[
        "group relative isolate min-w-0 overflow-hidden rounded-none border border-terracota-soft/25 bg-transparent",
        className,
      ].join(" ")}
    >
      {item.type === "image" ? (
        <Image
          src={item.src}
          alt={item.description}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover photo-editorial transition-transform duration-500 ease-snap group-hover:scale-[1.04]"
        />
      ) : (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full origin-center object-cover photo-editorial transition-[opacity,transform] duration-500 ease-snap will-change-transform group-hover:scale-[1.04]"
          muted
          loop
          playsInline
          preload="metadata"
          src={booted ? item.src : undefined}
          aria-label={item.description}
        />
      )}
    </Reveal>
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
        "home-lookbook home-pad-x overflow-x-clip border-t border-crema-light/10 bg-terracota-soft py-20 text-crema-light md:px-0 md:py-28 lg:py-28",
        className ?? "",
      ].join(" ")}
      aria-label="Lookbook en video"
    >
      <RevealStagger className="mx-auto mb-12 max-w-7xl md:home-pad-x lg:mb-12">
        <RevealItem
          as="p"
          className="font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow text-terracota-deep/90"
        >
          #MENESTERES
        </RevealItem>
        <RevealItem
          as="h2"
          className="mt-4 max-w-[min(100%,20ch)] text-balance font-display text-3xl font-normal leading-[1.02] tracking-tightish text-crema-light sm:mt-3 sm:text-4xl md:text-5xl lg:text-6xl"
        >
          Un espacio de <em className="italic text-terracota-deep">inspiración</em>
        </RevealItem>
        <RevealItem
          as="p"
          className="mt-6 max-w-[48ch] font-body text-[1rem] leading-[1.7] text-crema-light/75 sm:mt-5 sm:leading-[1.65]"
        >
          Clases, el local, el equipo y el ritmo de la cocina — en cinco tomas que se leen de un solo vistazo.
        </RevealItem>
      </RevealStagger>

      <div className="relative w-full border-y border-white/10 md:left-1/2 md:w-screen md:max-w-[100vw] md:-translate-x-1/2">
        <div
          className={[
            "mx-auto grid min-w-0 max-w-[1600px] grid-cols-2 max-md:gap-0 max-md:overflow-hidden max-md:rounded-sm max-md:border max-md:border-white/10 md:auto-rows-fr md:gap-0",
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
              index={index}
              className={lookbookCellClass(index, total)}
            />
          ))}
        </div>
      </div>

      <Reveal variant="fadeUp" delay={0.1} className="mx-auto mt-12 flex max-w-7xl justify-center md:home-pad-x lg:mt-12">
        <Button href="/galeria" variant="outline-cream">
          Descúbrelo
        </Button>
      </Reveal>
    </section>
  );
}
