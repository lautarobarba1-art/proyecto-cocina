"use client";

import * as React from "react";
import { motion } from "framer-motion";

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

  if (reduced) {
    return (
      <section
        className="border-b border-carbon bg-crema px-8 py-24 lg:px-10 lg:py-32"
        aria-labelledby="opening-statement-heading"
      >
        <div className="mx-auto flex min-h-[70vh] max-w-[1280px] flex-col">
          <p
            id="opening-statement-heading"
            className="mb-8 font-mono text-[10px] uppercase tracking-hero text-terracota"
          >
            <span aria-hidden="true">— </span>CAPÍTULO UNO
          </p>
          <h1 className="font-display text-[clamp(2.5rem,7vw,4rem)] font-normal leading-[1.05] tracking-tighter text-carbon max-w-[820px]">
            <span className="block">
              Antes de ser una <em className="italic text-terracota">cocina</em>,{" "}
            </span>
            <span className="block">
              Menesteres fue una <em className="italic text-terracota">excusa</em>
            </span>
            <span className="block">para juntarse.</span>
          </h1>
          <div className="mt-auto flex flex-wrap items-end justify-between gap-6 pt-16 lg:pt-20">
            <p className="font-mono text-[10px] uppercase tracking-meta text-carbon/55">
              <span aria-hidden="true">↓ </span>SEGUÍ LEYENDO
            </p>
            <p className="font-display text-[13px] italic text-carbon/70">— Rafaela, 2019</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="border-b border-carbon bg-crema px-8 py-24 lg:px-10 lg:py-32"
      aria-labelledby="opening-statement-heading"
    >
      <div className="mx-auto flex min-h-[70vh] max-w-[1280px] flex-col">
        <p
          id="opening-statement-heading"
          className="mb-8 font-mono text-[10px] uppercase tracking-hero text-terracota"
        >
          <span aria-hidden="true">— </span>CAPÍTULO UNO
        </p>

        <motion.h1
          className="font-display text-[clamp(2.5rem,7vw,4rem)] font-normal leading-[1.05] tracking-tighter text-carbon max-w-[820px]"
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

        <div className="mt-auto flex flex-wrap items-end justify-between gap-6 pt-16 lg:pt-20">
          <p className="font-mono text-[10px] uppercase tracking-meta text-carbon/55">
            <span aria-hidden="true">↓ </span>SEGUÍ LEYENDO
          </p>
          <p className="font-display text-[13px] italic text-carbon/70">— Rafaela, 2019</p>
        </div>
      </div>
    </section>
  );
}
