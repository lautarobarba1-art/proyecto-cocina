"use client";

import { motion, useScroll, useTransform } from "framer-motion";

import { KenBurns } from "@/components/animations/KenBurns";
import { Logotype } from "@/components/brand/Logotype";
import { Button } from "@/components/ui/Button";
import { HERO_AFTER_SPLASH_DELAYS, HERO_ENTRY } from "@/lib/motion";
import { IMAGES } from "@/lib/images";
import { siteContact } from "@/lib/site/contact";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useTypewriter } from "@/lib/useTypewriter";

const HEADLINE = ["Cocinamos en grupo.", "Armamos encuentros."] as const;



export interface HeroProps {
  className?: string;
  introReveal?: boolean;
  staggerProfile?: "default" | "afterSplash";
  onVideoReady?: () => void;
}

export function Hero({ className, introReveal = true, staggerProfile = "default", onVideoReady }: HeroProps) {
  const reduced = useReducedMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, (value) => (reduced ? 0 : value * 0.15));

  const ready = reduced || introReveal;
  const delays = staggerProfile === "afterSplash" ? HERO_AFTER_SPLASH_DELAYS : HERO_ENTRY.delays;
  const actionDelay = delays[2] + 0.06;
  const scrollDelay = actionDelay + 0.14;

  const headlineDelay = (delays[1] + 0.04) * 1000;
  const { texts: headlineTexts, done: headlineDone, active: headlineActive } = useTypewriter(
    HEADLINE,
    ready,
    reduced,
    { startDelay: headlineDelay, speed: 40, pauseBetween: 220 }
  );

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
                onCanPlay={onVideoReady}
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

      
      {/* Contenido del hero */}
      <div className="hero-mn__content absolute inset-0 z-20 flex flex-col px-5 pb-10 pt-8 md:px-10 md:pb-14 md:pt-12 lg:px-12 lg:pb-16 lg:pt-14">

        {/* Marca centrada + slogan — solo mobile */}
        <motion.div className="hero-mn__brand absolute left-1/2 top-1/2 w-[min(calc(100vw-2.5rem),420px)] -translate-x-1/2 -translate-y-1/2 md:hidden">
          <Logotype
            variant="onDark"
            size="lg"
            asset="brandvariant"
            className="w-full! max-w-none! h-auto"
            priority
          />
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

          {/* H1 editorial — typewriter */}
          <motion.h1
            className="max-w-[14ch] font-display text-[clamp(2rem,6vw,4.75rem)] font-normal leading-[1.02] tracking-tightish text-crema"
            initial={reduced ? { opacity: 1, y: 0 } : { opacity: 1, y: 22 }}
            animate={ready ? { opacity: 1, y: 0 } : { opacity: 1, y: 22 }}
            transition={entry(delays[1] + 0.04)}
          >
            <em className="font-medium italic">{headlineTexts[0]}</em>
            {headlineTexts[1].length > 0 && (
              <>
                {" "}
                <em className="font-bold italic" style={{ color: "var(--m-orange-light)" }}>
                  <strong>{headlineTexts[1]}</strong>
                </em>
              </>
            )}
            {headlineActive && !headlineDone && (
              <span className="typewriter-cursor text-crema/50">|</span>
            )}
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
            <Button href="#sobre" variant="sketch-on-dark" size="lg">
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
