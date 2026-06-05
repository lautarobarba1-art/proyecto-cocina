"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";

import { KenBurns } from "@/components/animations/KenBurns";
import { Logotype } from "@/components/brand/Logotype";
import { Button } from "@/components/ui/Button";
import { HERO_AFTER_SPLASH_DELAYS, HERO_ENTRY } from "@/lib/motion";
import { IMAGES } from "@/lib/images";
import { siteContact } from "@/lib/site/contact";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * Acentos alrededor del hero (solo mobile) — ~4 arriba / 3 medio / 6 abajo.
 */
const HERO_BRAND_DECORATIONS = [
  /* Arriba */
  {
    src: "hoja-laurel-menesteres",
    className: "top-[18%] left-6 h-14 w-20 -rotate-12 sm:top-[16%] sm:left-12 sm:h-16 sm:w-24",
  },
  {
    src: "batidor-menesteres",
    className:
      "top-[22%] right-6 h-14 w-10 rotate-[-24deg] sm:top-[20%] sm:right-12 sm:h-16 sm:w-12",
  },
  {
    src: "limon-menesteres",
    className: "top-[14%] right-[20%] h-12 w-12 rotate-12 sm:top-[12%] sm:right-[24%] sm:h-14 sm:w-14",
  },
  {
    src: "pan-menesteres",
    className: "top-[16%] left-[32%] h-12 w-16 -rotate-8 sm:top-[14%] sm:left-[36%] sm:h-14 sm:w-20",
  },
  /* Mitad — flancos (altura del logo) */
  {
    src: "tabla-cocina-menesteres",
    className: "left-4 top-[50%] h-20 w-28 -rotate-6 sm:left-8 sm:top-[48%] sm:h-24 sm:w-32",
  },
  {
    src: "plato-menesteres",
    className: "right-4 top-[48%] h-16 w-16 rotate-6 sm:right-10 sm:top-[46%] sm:h-20 sm:w-20",
  },
  {
    src: "copa-brindis-menesteres",
    className: "top-[38%] right-[14%] h-16 w-12 rotate-8 sm:right-[18%] sm:h-16 sm:w-14",
  },
  /* Abajo — esquinas, banda inferior e ingredientes */
  {
    src: "sarten-menesteres",
    className:
      "bottom-6 right-2 h-16 w-16 rotate-12 sm:bottom-8 sm:right-3 sm:h-20 sm:w-20 lg:bottom-10 lg:right-4",
  },
  {
    src: "cuchillo-chef-menesteres",
    className:
      "bottom-8 left-3 h-20 w-20 rotate-18 sm:bottom-10 sm:left-4 sm:h-28 sm:w-28 lg:bottom-12 lg:left-6",
  },
  {
    src: "olla-menesteres",
    className:
      "bottom-32 right-12 h-24 w-24 rotate-18 sm:bottom-36 sm:right-18 sm:h-28 sm:w-28 lg:bottom-40 lg:right-22",
  },
  {
    src: "cuchara-menesteres",
    className:
      "bottom-52 left-14 h-16 w-24 -rotate-12 sm:bottom-56 sm:left-20 sm:h-20 sm:w-28 lg:bottom-60 lg:left-24",
  },
  {
    src: "tomate-menesteres",
    className: "bottom-28 left-8 h-14 w-14 -rotate-12 sm:bottom-32 sm:left-12 sm:h-16 sm:w-16",
  },
  {
    src: "ajo-menesteres",
    className:
      "bottom-64 right-12 h-11 w-11 rotate-6 sm:bottom-68 sm:right-18 sm:h-12 sm:w-12 lg:bottom-72 lg:right-22",
  },
] as const;

export interface HeroProps {
  className?: string;
  introReveal?: boolean;
  staggerProfile?: "default" | "afterSplash";
}

export function Hero({ className, introReveal = true, staggerProfile = "default" }: HeroProps) {
  const reduced = useReducedMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, (value) => (reduced ? 0 : value * 0.15));

  const ready = reduced || introReveal;
  const delays = staggerProfile === "afterSplash" ? HERO_AFTER_SPLASH_DELAYS : HERO_ENTRY.delays;
  const actionDelay = delays[2] + 0.06;
  const scrollDelay = actionDelay + 0.14;

  const entry = (delay: number) =>
    reduced
      ? undefined
      : {
          duration: HERO_ENTRY.duration,
          ease: HERO_ENTRY.ease,
          delay: ready ? delay : 0,
        };

  return (
    <section
      id="hero"
      className={["hero-mn relative h-svh min-h-[520px] overflow-hidden bg-carbon", className ?? ""].join(" ")}
      aria-label="Portada"
    >
      {/* Video background with parallax */}
      <motion.div
        className="hero-mn__parallax absolute inset-0 z-0"
        style={reduced ? undefined : { y }}
        aria-hidden="true"
      >
        <div className="hero-mn__bg absolute inset-0 overflow-hidden">
          <KenBurns className="hero-mn__kenburns absolute inset-0">
            <div className="hero-mn__media hero-mn__media--video absolute inset-0">
              <video
                className="absolute inset-0 z-1 h-full w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                aria-hidden="true"
              >
                <source src={IMAGES.hero.videoSrc} type="video/mp4" />
              </video>
            </div>
          </KenBurns>
        </div>
        <div className="hero-mn__overlay pointer-events-none absolute inset-0" />
      </motion.div>

      {/* Guarda superior — patrón de marca, textura sutil */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-40 select-none"
        style={{
          backgroundImage: "url('/patrones/carpeta-patrones/Mesa%20de%20trabajo%2012.png')",
          backgroundSize: "180% auto",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center top",
          maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 100%)",
          opacity: 0.22,
        }}
      />

      {/* Acentos gastronómicos — solo mobile (marco alrededor del logo) */}
      <div className="pointer-events-none absolute inset-0 z-15 md:hidden" aria-hidden>
        {HERO_BRAND_DECORATIONS.map(({ src, className }) => (
          <Image
            key={src}
            src={`/brand-elements/menesteres-elements/${src}.svg`}
            alt=""
            aria-hidden
            width={240}
            height={240}
            className={`hero-mn__deco absolute select-none ${className}`}
          />
        ))}
      </div>
      {/* Contenido del hero */}
      <div className="hero-mn__content absolute inset-0 z-20 flex flex-col px-5 pb-10 pt-8 md:px-10 md:pb-14 md:pt-12 lg:px-12 lg:pb-16 lg:pt-14">

        {/* Marca centrada + slogan — solo mobile */}
        <motion.div className="hero-mn__brand absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:hidden">
          <div className="relative mx-auto w-fit">
            <Image
              src="/brand-elements/menesteres-elements/espatula-menesteres.svg"
              alt=""
              aria-hidden="true"
              width={120}
              height={120}
              className="hero-mn__deco hero-mn__deco--logo pointer-events-none absolute bottom-[calc(100%+0.5rem)] left-0 z-10 h-12 w-12 translate-x-[-55%] -rotate-12 select-none sm:bottom-[calc(100%+0.75rem)] sm:h-14 sm:w-14 sm:translate-x-[-60%]"
            />
            <div className="w-[min(100%,320px)]">
              <Logotype
                variant="onDark"
                size="lg"
                asset="brandvariant"
                className="w-full! max-w-none! h-auto"
                priority
              />
            </div>
          </div>
        </motion.div>

        {/* Editorial — título, subtítulo y acciones en la parte inferior */}
        <div className="mt-auto ">

        <div className="hidden md:block">

          {/* Eyebrow */}
          <motion.p className="hero-mn__eyebrow mb-5">
            {`— Espacio gastronómico · ${siteContact.address.locality}`}
          </motion.p>

          {/* H1 editorial */}
          <motion.h1
            className="hero-mn__eyebrow mb-5"
            initial={reduced ? { opacity: 1 } : { opacity: 0 }}
            animate={ready ? { opacity: 1 } : { opacity: 0 }}
            transition={entry(delays[1])}
          >
            MENE<em className="italic">STE</em>RES
          </motion.h1>

          {/* H1 editorial */}
          <motion.h1
            className="max-w-[14ch] font-display text-[clamp(2rem,6vw,4.75rem)] font-normal leading-[1.02] tracking-tightish text-crema"
            initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 22 }}
            animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 22 }}
            transition={entry(delays[1] + 0.04)}
          >
            Cocinamos en grupo.{" "}
            <em className="italic" style={{ color: "var(--m-orange-light)" }}>
              Armamos encuentros.
            </em>
          </motion.h1>

          {/* Subtítulo */}
          <motion.p
            className="mt-5 max-w-[36ch] font-body text-[0.93rem] leading-[1.72] text-crema/60 sm:text-[1rem]"
            initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
            animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
            transition={entry(delays[2])}
          >
            Clases de cocina, experiencias gastronómicas y momentos compartidos alrededor de una mesa.
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="mt-8 flex flex-wrap gap-3"
            initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            transition={entry(actionDelay)}
          >
            <Button href="/clases" variant="sketch-on-dark" size="lg">
              Ver próximas clases
            </Button>
            <Button href="#sobre" variant="outline-cream" size="default">
              Conocer Menesteres
            </Button>
          </motion.div>
        </div>
      </div>

          
        </div>
          
      {/* Indicador de scroll */}
      <motion.div
        className="hero-mn__scroll pointer-events-none absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2"
        initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={entry(scrollDelay)}
      >
        <div className="hero-mn__scroll-line" />
      </motion.div>
    </section>
  );
}
