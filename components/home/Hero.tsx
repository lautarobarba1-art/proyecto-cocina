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

  // Mobile scroll effects
  const mobileLogoOpacity = useTransform(scrollY, [0, 180], [1, 0]);
  const mobileSectionScale = useTransform(scrollY, [0, 260], [1, 0.96]);
  const mobileSectionOpacity = useTransform(scrollY, [0, 260], [1, 0.5]);

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
      className={["hero-mn bg-carbon pt-16 md:pt-0 md:relative md:h-svh md:min-h-[520px] md:overflow-hidden", className ?? ""].join(" ")}
      aria-label="Portada"
    >
      {/* ── MOBILE: video 16:9 con logotype centrado y efectos de scroll ── */}
      <motion.div
        className="md:hidden relative aspect-video w-full overflow-hidden"
        style={reduced ? undefined : { scale: mobileSectionScale, opacity: mobileSectionOpacity }}
      >
        <video
          className="absolute inset-0 h-full w-full object-cover"
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

        {/* Overlay sutil para legibilidad del logo */}
        <div className="absolute inset-0 bg-black/25 pointer-events-none" aria-hidden="true" />

        {/* Logotype centrado sobre el video */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center px-8"
          style={reduced ? undefined : { opacity: mobileLogoOpacity }}
        >
          <Logotype
            variant="onDark"
            size="lg"
            asset="brandvariant"
            className="w-full! max-w-[300px]! h-auto"
            priority
          />
        </motion.div>
      </motion.div>

      {/* ── DESKTOP: video fullscreen con parallax y KenBurns ── */}
      <motion.div
        className="hero-mn__parallax hidden md:block absolute inset-0 z-0"
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
                <source src={IMAGES.hero.videoDesktopSrc} type="video/mp4" />
              </video>
            </div>
          </KenBurns>
        </div>
        <div className="hero-mn__overlay pointer-events-none absolute inset-0" />
      </motion.div>

      {/* Guarda superior — solo desktop */}
      <div
        aria-hidden="true"
        className="hidden md:block pointer-events-none absolute inset-x-0 top-0 z-10 h-40 select-none"
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
      {/* ── DESKTOP: contenido editorial ── */}
      <div className="hero-mn__content hidden md:flex absolute inset-0 z-20 flex-col px-5 pb-10 pt-8 md:px-10 md:pb-14 md:pt-12 lg:px-12 lg:pb-16 lg:pt-14">
        <div className="mt-auto">
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

          {/* H1 — typewriter */}
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

      {/* Indicador de scroll — solo desktop */}
      <motion.div
        className="hero-mn__scroll pointer-events-none hidden md:flex absolute bottom-6 left-1/2 z-20 -translate-x-1/2 flex-col items-center gap-2"
        initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={entry(scrollDelay)}
      >
        <div className="hero-mn__scroll-line" />
      </motion.div>
    </section>
  );
}
