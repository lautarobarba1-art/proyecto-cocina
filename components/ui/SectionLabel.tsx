"use client";

import * as React from "react";
import { useInView } from "framer-motion";

import { useReducedMotion } from "@/lib/useReducedMotion";

export interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * SectionLabel — eyebrow editorial del DS Menesteres.
 *
 * Especificación: 12px / 700 / tracking 0.2em / uppercase / terracota.
 * Acompañado de un dash de 28×3px que crece desde 0 cuando entra al viewport.
 */
export function SectionLabel({ children, className }: SectionLabelProps) {
  const reduced = useReducedMotion();
  const ref = React.useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -20% 0px" });

  return (
    <div
      ref={ref}
      data-inview={inView ? "true" : "false"}
      data-reduced={reduced ? "true" : "false"}
      className={[
        "flex items-center gap-3 font-sans text-[12px] font-bold uppercase tracking-meta text-terracota",
        className ?? "",
      ].join(" ")}
    >
      <span aria-hidden="true" className="section-label-dash block h-[3px] bg-terracota" />
      <span>{children}</span>
    </div>
  );
}
