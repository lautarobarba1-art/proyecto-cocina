"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Image from "next/image";

import { BrandButton } from "@/components/ui/BrandButton";
import { ServiceLabel } from "@/components/ui/ServiceLabel";

export interface HeroSectionProps {
  heroImageSrc?: string;
  city?: string;
}

const container = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.2,
      staggerChildren: 0.15,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: "easeOut" as const },
  },
};

export function HeroSection({
  heroImageSrc,
  city = "Rafaela, Santa Fe",
}: HeroSectionProps) {
  const reducedMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const indicatorOpacity = useTransform(scrollY, [0, 100], [1, 0]);
  const initial = reducedMotion ? false : "hidden";

  return (
    <section id="hero" className="relative h-dvh min-h-[620px] overflow-hidden bg-carbon" aria-label="Portada">
      <div aria-hidden="true" className="absolute inset-0">
        {heroImageSrc ? (
          <Image
            src={heroImageSrc}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="h-full w-full bg-[linear-gradient(160deg,#2C1810_0%,#D65226_60%,#813408_100%)]" />
        )}
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(20,20,20,0.35)_0%,rgba(20,20,20,0.55)_60%,rgba(20,20,20,0.75)_100%)]"
      />

      <motion.div
        className="absolute inset-x-0 bottom-[15%] z-10 mx-auto max-w-[1200px] px-5 text-center md:px-8 md:text-left"
        variants={container}
        initial={initial}
        animate="visible"
      >
        <motion.div variants={item}>
          <ServiceLabel
            service="clases"
            text={`ESPACIO GASTRONÓMICO · ${city}`}
            className="text-crema/75"
          />
        </motion.div>
        
        <motion.div
          variants={item}
          className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start"
        >
          <BrandButton href="/clases" variant="primary" size="lg">
            Ver próximas clases
          </BrandButton>
          <BrandButton href="#servicios" variant="ghost" size="md">
            Conocer el espacio ↓
          </BrandButton>
        </motion.div>
      </motion.div>

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-crema/50"
        style={{ opacity: indicatorOpacity }}
        animate={reducedMotion ? undefined : { y: [0, 8, 0] }}
        transition={reducedMotion ? undefined : { duration: 2, ease: "easeInOut", repeat: Infinity }}
      >
        <ChevronDown size={24} />
      </motion.div>
    </section>
  );
}
