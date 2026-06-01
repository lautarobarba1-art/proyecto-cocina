"use client";

import * as React from "react";
import { motion, useInView } from "framer-motion";

import { Container } from "@/components/layout/Container";
import { siteContact } from "@/lib/site/contact";
import { useReducedMotion } from "@/lib/useReducedMotion";

export interface HomePullQuoteProps {
  className?: string;
}

/** Cita editorial estática — reemplaza el marquee infinito. */
export function HomePullQuote({ className }: HomePullQuoteProps) {
  const reduced = useReducedMotion();
  const ref = React.useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });

  return (
    <section
      className={[
        "home-pull-quote border-y border-terracota/20 bg-terracota py-10 sm:py-12 lg:py-14",
        className ?? "",
      ].join(" ")}
      aria-label="Frase de Menesteres"
    >
      <Container as="div">
        <motion.div
          ref={ref}
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-160 text-center"
        >
          <p className="font-serif text-[clamp(1.35rem,3vw,1.85rem)] font-medium italic leading-[1.35] tracking-[0.02em] text-crema">
            “Sabores que nos encuentran”
          </p>
          <p className="mt-4 font-mono text-[0.65rem] font-medium uppercase tracking-meta text-crema/75">
            desde 2019 · {siteContact.address.locality}
          </p>
        </motion.div>
      </Container>
    </section>
  );
}

/** @deprecated Usar HomePullQuote */
export { HomePullQuote as Marquee };
