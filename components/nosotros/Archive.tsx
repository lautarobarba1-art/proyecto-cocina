"use client";

import * as React from "react";
import { motion, useInView } from "framer-motion";

import { Counter } from "@/components/nosotros/Counter";
import { NosotrosDashLabel } from "@/components/nosotros/NosotrosDashLabel";
import { stats, timeline } from "@/lib/content/nosotros";
import { useReducedMotion } from "@/lib/useReducedMotion";

export function Archive() {
  const reduced = useReducedMotion();
  const titleRef = React.useRef<HTMLHeadingElement | null>(null);
  const titleInView = useInView(titleRef, { once: true, margin: "0px 0px -15% 0px" });

  return (
    <section
      className="bg-carbon px-8 py-20 text-crema lg:px-10 lg:py-24"
      aria-labelledby="archive-dash-label"
    >
      <div className="mx-auto max-w-[920px]">
        <NosotrosDashLabel id="archive-dash-label" variant="dark">
          04 — ARCHIVO
        </NosotrosDashLabel>

        <h2
          ref={titleRef}
          data-inview={titleInView ? "true" : "false"}
          data-reduced={reduced ? "true" : "false"}
          className="section-title mt-6 font-display text-[clamp(1.75rem,4vw,2.5rem)] font-normal leading-tight tracking-tightish text-crema"
        >
          Siete años en <em className="italic text-terracota-soft">números</em>.
        </h2>

        <div className="mt-12 grid grid-cols-2 gap-x-8 gap-y-10 lg:mt-14 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="border-t border-crema/20 pt-4">
              <div className="font-display text-[clamp(2.5rem,5vw,3.5rem)] font-normal italic leading-none text-terracota-soft">
                {s.animate ? (
                  <Counter
                    target={Number(s.value)}
                    format={(n) => n.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                  />
                ) : (
                  s.value
                )}
              </div>
              <p className="mt-3 font-mono text-[10px] font-medium uppercase tracking-meta text-crema/60">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-dashed border-crema/25 pt-8 lg:mt-14">
          <p className="text-center font-mono text-[10px] font-medium uppercase tracking-meta text-crema/45">
            <span aria-hidden="true">— </span>LÍNEA TEMPORAL<span aria-hidden="true"> —</span>
          </p>
          <ol className="mt-8 list-none space-y-0">
            {timeline.map((row, i) => (
              <motion.li
                key={row.year}
                initial={reduced ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-8% 0px" }}
                transition={{ duration: 0.45, delay: reduced ? 0 : i * 0.06 }}
                className="grid grid-cols-1 gap-3 border-b border-crema/10 py-5 md:grid-cols-[80px_1fr] md:gap-6 md:py-6"
              >
                <span className="font-display text-[17px] italic text-terracota-soft">{row.year}</span>
                <span className="font-display text-[15px] leading-snug text-crema/85">{row.text}</span>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
