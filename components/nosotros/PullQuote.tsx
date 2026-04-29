"use client";

import * as React from "react";
import { motion, useInView } from "framer-motion";

import { pullQuote } from "@/lib/content/nosotros";
import { useReducedMotion } from "@/lib/useReducedMotion";

export function PullQuote() {
  const reduced = useReducedMotion();
  const rootRef = React.useRef<HTMLElement | null>(null);
  const inView = useInView(rootRef, { once: true, margin: "0px 0px -12% 0px" });

  return (
    <section
      ref={rootRef}
      className="bg-carbon px-8 py-20 text-crema lg:px-10 lg:py-24"
      aria-labelledby="pullquote-label"
      data-pull-inview={inView ? "true" : "false"}
      data-pull-reduced={reduced ? "true" : "false"}
    >
      <p id="pullquote-label" className="sr-only">
        Cita destacada de la fundadora
      </p>
      <motion.div
        initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        animate={reduced || inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="mx-auto grid max-w-[920px] grid-cols-1 gap-6 md:grid-cols-[80px_1fr]"
      >
        <p className="font-mono text-[11px] font-medium uppercase tracking-eyebrow text-terracota-soft md:pt-1">
          02 <span aria-hidden="true">—</span>
        </p>
        <div>
          <p className="mb-3 font-display text-[13px] italic tracking-wide text-crema/50">
            {pullQuote.eyebrow}
          </p>
          <blockquote>
            <p className="pull-quote-text font-display text-[clamp(1.5rem,3vw,2.25rem)] font-normal leading-[1.15] text-crema max-w-[620px]">
              <span className="text-crema">&ldquo;{pullQuote.quoteBefore}</span>
              <em className="pull-quote-em">{pullQuote.quoteEm}</em>
              <span className="text-crema">
                {pullQuote.quoteAfter}
                &rdquo;
              </span>
            </p>
            <footer className="mt-6 font-mono text-[11px] uppercase tracking-meta text-crema/70">
              <span aria-hidden="true">— </span>
              {pullQuote.attribution}
            </footer>
          </blockquote>
        </div>
      </motion.div>
    </section>
  );
}
