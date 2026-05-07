"use client";

import { motion, useScroll, useTransform } from "framer-motion";

import { KenBurns } from "@/components/animations/KenBurns";
import { Logotype } from "@/components/brand/Logotype";
import { Button } from "@/components/ui/Button";
import { HERO_AFTER_SPLASH_DELAYS, HERO_ENTRY } from "@/lib/motion";
import { IMAGES } from "@/lib/images";
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
  const ctaDelay = delays[2] + 0.08;
  const scrollDelay = ctaDelay + 0.12;

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
            <div
              className={[
                "hero-mn__media absolute inset-0",
                "hero-mn__media--video",
              ].join(" ")}
            >
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

      <motion.div
        className="hero-mn__meta-top pointer-events-none absolute left-0 right-0 top-6 z-20 flex justify-between px-8"
        initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
        animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
        transition={
          reduced
            ? undefined
            : {
                duration: HERO_ENTRY.duration,
                ease: HERO_ENTRY.ease,
                delay: ready ? delays[0] : 0,
              }
        }
      >
        <span>EST · 2019</span>
        <span>RAFAELA · SF · AR</span>
      </motion.div>

      <div className="hero-mn__content absolute inset-0 z-20 flex flex-col items-center justify-center px-8 text-center">
        <motion.p
          className="hero-mn__eyebrow"
          initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={
            reduced
              ? undefined
              : {
                  duration: HERO_ENTRY.duration,
                  ease: HERO_ENTRY.ease,
                  delay: ready ? delays[0] : 0,
                }
          }
        >
          CLASES DE COCINA
        </motion.p>

        <motion.div
          initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={
            reduced
              ? undefined
              : {
                  duration: HERO_ENTRY.duration,
                  ease: HERO_ENTRY.ease,
                  delay: ready ? delays[1] : 0,
                }
          }
        >
          <h1 className="hero-mn__title">
            <Logotype variant="onDark" size="xl" priority />
          </h1>
        </motion.div>

        <motion.p
          className="hero-mn__tagline"
          initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={
            reduced
              ? undefined
              : {
                  duration: HERO_ENTRY.duration,
                  ease: HERO_ENTRY.ease,
                  delay: ready ? delays[2] : 0,
                }
          }
        >
          Sabores que nos encuentran
        </motion.p>

        <motion.div
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
          initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={
            reduced
              ? undefined
              : {
                  duration: HERO_ENTRY.duration,
                  ease: HERO_ENTRY.ease,
                  delay: ready ? ctaDelay : 0,
                }
          }
        >
          <Button href="/clases" variant="primary" size="lg">
            Reservar clase
          </Button>
          <Button href="/espacio" variant="outline-cream" size="lg">
            Conocer el espacio
          </Button>
        </motion.div>
      </div>

      <motion.div
        className="hero-mn__scroll pointer-events-none absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2"
        initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={
          reduced
            ? undefined
            : {
                duration: HERO_ENTRY.duration,
                ease: HERO_ENTRY.ease,
                delay: ready ? scrollDelay : 0,
              }
        }
      >
        <span>SCROLL</span>
        <div className="hero-mn__scroll-line" />
      </motion.div>
    </section>
  );
}
