"use client";

import * as React from "react";
import { motion } from "framer-motion";

import { NosotrosDashLabel } from "@/components/nosotros/NosotrosDashLabel";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { interview } from "@/lib/content/nosotros";
import { useReducedMotion } from "@/lib/useReducedMotion";

export function Interview() {
  const reduced = useReducedMotion();

  return (
    <section
      className="border-b border-carbon bg-crema px-8 py-20 lg:px-10 lg:py-24"
      aria-labelledby="interview-dash-label"
    >
      <div className="mx-auto max-w-[760px]">
        <NosotrosDashLabel id="interview-dash-label">03 — LA ENTREVISTA</NosotrosDashLabel>

        <SectionTitle className="mt-6 mb-12 text-[2rem] leading-tight">
          Cinco preguntas, una <em>cocina</em>.
        </SectionTitle>
        <p className="sr-only">Entrevista en formato pregunta y respuesta</p>

        <dl className="mt-12">
          {interview.map((row, i) => (
            <motion.div
              key={row.q}
              initial={reduced ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ duration: 0.5, delay: reduced ? 0 : i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="mb-9 last:mb-0"
            >
              <div className="mb-3 flex items-baseline gap-3.5">
                <span className="font-display text-[22px] italic leading-none text-terracota">P.</span>
                <dt className="flex-1 font-display text-[19px] leading-[1.4] text-carbon">{row.q}</dt>
              </div>
              <div className="flex items-baseline gap-3.5 border-l border-carbon/20 pl-3">
                <span className="font-display text-[22px] italic leading-none text-carbon/40">R.</span>
                <dd className="flex-1 font-display text-[16px] leading-[1.65] text-carbon/85">{row.a}</dd>
              </div>
            </motion.div>
          ))}
        </dl>
      </div>
    </section>
  );
}
