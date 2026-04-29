"use client";

import * as React from "react";
import { motion } from "framer-motion";

import { NosotrosDashLabel } from "@/components/nosotros/NosotrosDashLabel";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { houseRules } from "@/lib/content/nosotros";
import { useReducedMotion } from "@/lib/useReducedMotion";

export function HouseRules() {
  const reduced = useReducedMotion();

  return (
    <section
      className="border-b border-carbon bg-crema px-8 py-20 lg:px-10 lg:py-24"
      aria-labelledby="house-rules-dash-label"
    >
      <div className="mx-auto max-w-[920px]">
        <NosotrosDashLabel id="house-rules-dash-label">05 — PRINCIPIOS</NosotrosDashLabel>

        <SectionTitle className="mt-6 text-[clamp(1.75rem,3.5vw,2.25rem)] leading-tight">
          Las reglas <em>no escritas</em> de la casa.
        </SectionTitle>

        <ul className="mt-10 list-none">
          {houseRules.map((rule, i) => (
            <motion.li
              key={rule.numeral}
              initial={reduced ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ duration: 0.55, delay: reduced ? 0 : i * 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="grid grid-cols-[60px_1fr] gap-6 border-t border-carbon/20 py-6 last:border-b"
            >
              <div className="pt-1 font-mono text-[11px] text-terracota/70">
                <span aria-hidden="true">— </span>
                {rule.numeral}.
              </div>
              <div>
                <p className="mb-1 font-display text-[22px] italic leading-[1.2] text-carbon">{rule.rule}</p>
                <p className="font-display text-[14px] leading-[1.5] text-carbon/65">{rule.explanation}</p>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
