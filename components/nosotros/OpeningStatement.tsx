"use client";

import * as React from "react";
import { motion } from "framer-motion";

import { BrandIllustration } from "@/components/ui/BrandIllustration";
import { BrandPatternBackground } from "@/components/ui/BrandPatternBackground";
import { useReducedMotion } from "@/lib/useReducedMotion";

const container = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.2, delayChildren: 0.12 },
  },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

export function OpeningStatement() {
  const reduced = useReducedMotion();

  const heading = reduced ? (
    <h1 className="max-w-[820px] font-display text-[clamp(2.5rem,7vw,4rem)] font-normal leading-[1.05] tracking-tighter text-carbon">
      <span className="block">
        Antes de ser una <em className="italic text-terracota">cocina</em>,{" "}
      </span>
      <span className="block">
        Menesteres fue una <em className="italic text-terracota">excusa</em>
      </span>
      <span className="block">para juntarse.</span>
    </h1>
  ) : (
    <motion.h1
      className="max-w-[820px] font-display text-[clamp(2.5rem,7vw,4rem)] font-normal leading-[1.05] tracking-tighter text-carbon"
      initial="hidden"
      animate="visible"
      variants={container}
    >
      <motion.span className="block" variants={item}>
        Antes de ser una <em className="italic text-terracota">cocina</em>,{" "}
      </motion.span>
      <motion.span className="block" variants={item}>
        Menesteres fue una <em className="italic text-terracota">excusa</em>
      </motion.span>
      <motion.span className="block" variants={item}>
        para juntarse.
      </motion.span>
    </motion.h1>
  );

  return (
    <section
      className="relative overflow-hidden border-b border-carbon bg-crema px-8 py-24 lg:px-10 lg:py-32"
      aria-labelledby="opening-statement-heading"
    >
      <BrandPatternBackground
        src="/patrones/carpeta-patrones/Mesa%20de%20trabajo%2010.png"
        opacity={0.04}
        tileSize={360}
      />
      <div className="relative mx-auto flex min-h-[70vh] max-w-[1280px] flex-col">
        <p
          id="opening-statement-heading"
          className="mb-8 font-mono text-[10px] uppercase tracking-hero text-terracota"
        >
          <span aria-hidden="true">— </span>CAPÍTULO UNO
        </p>

        {heading}

        <div className="mt-auto flex flex-wrap items-end justify-between gap-6 pt-16 lg:pt-20">
          <p className="font-mono text-[10px] uppercase tracking-meta text-carbon/55">
            <span aria-hidden="true">↓ </span>SEGUÍ LEYENDO
          </p>
          <p className="font-display text-[13px] italic text-carbon/70">— Rafaela, 2019</p>
        </div>
      </div>

      <BrandIllustration
        src="/brand-elements/menesteres-elements/hoja-laurel-menesteres.svg"
        size={130}
        opacity={0.12}
        rotate={20}
        hideOnMobile
        className="absolute bottom-16 right-10 lg:right-20"
      />
    </section>
  );
}
