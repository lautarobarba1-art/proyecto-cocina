"use client";

import { motion, useScroll, useTransform } from "framer-motion";

import { KenBurns } from "@/components/animations/KenBurns";
import { Logotype } from "@/components/brand/Logotype";
import { Button } from "@/components/ui/Button";
import { HERO_AFTER_SPLASH_DELAYS, HERO_ENTRY } from "@/lib/motion";
import { IMAGES } from "@/lib/images";
import { siteContact } from "@/lib/site/contact";
import { useReducedMotion } from "@/lib/useReducedMotion";

export interface HeroProps {
  className?: string;
  /** Cuando la intro (splash) termina, las animaciones de texto arrancan. */
  introReveal?: boolean;
  /** `afterSplash`: stagger alineado al fin de la cortina; `default`: timing editorial original. */
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
      className={["hero-mn relative h-svh min-h-[460px] overflow-hidden bg-carbon", className ?? ""].join(" ")}
      aria-label="Portada"
    >
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
    
      <div className="hero-mn__content absolute inset-0 z-20 flex flex-col px-8 pb-25 pt-50 sm:px-8 sm:pb-10 sm:pt-16 lg:px-12 lg:pb-14">
        <motion.div
          className="hero-mn__brand max-w-[min(100%,28rem)] text-left"
          initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={entry(delays[0])}
        >
          
          <h1 className="hero-mn__title mt-5">
            <Logotype variant="onDark" size="xl" priority />
          </h1>
          
        </motion.div>

        <motion.div
          className="hero-mn__action mt-auto ml-auto w-full max-w-[min(100%,22rem)] text-right"
          initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
          animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
          transition={entry(actionDelay)}
        >
          <div className="flex flex-col items-end gap-3 sm:gap-4">
            <Button href="/clases" variant="sketch-on-dark" size="lg">
              Reservar clase
            </Button>
            
          </div>

        </motion.div>
      </div>

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
