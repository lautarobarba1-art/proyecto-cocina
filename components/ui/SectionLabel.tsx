"use client";

import * as React from "react";
import { useInView } from "framer-motion";

import { useReducedMotion } from "@/lib/useReducedMotion";

export interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
}

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
        "flex items-center gap-3 font-mono text-[0.75rem] font-medium uppercase tracking-eyebrow text-terracota",
        className ?? "",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className="section-label-dash block h-px bg-terracota"
      />
      <span>{children}</span>
    </div>
  );
}

