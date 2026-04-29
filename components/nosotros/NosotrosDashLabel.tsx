"use client";

import * as React from "react";
import { useInView } from "framer-motion";

import { useReducedMotion } from "@/lib/useReducedMotion";

export interface NosotrosDashLabelProps {
  id: string;
  children: React.ReactNode;
  /** `dark` = fondo carbon / bloque oscuro. */
  variant?: "light" | "dark";
  className?: string;
}

export function NosotrosDashLabel({ id, children, variant = "light", className }: NosotrosDashLabelProps) {
  const reduced = useReducedMotion();
  const ref = React.useRef<HTMLParagraphElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -18% 0px" });

  const text = variant === "dark" ? "text-terracota-soft" : "text-terracota";
  const dash = variant === "dark" ? "bg-terracota-soft" : "bg-terracota";

  return (
    <p
      ref={ref}
      id={id}
      data-inview={inView ? "true" : "false"}
      data-reduced={reduced ? "true" : "false"}
      className={[
        "flex items-center gap-3 font-mono text-[10px] font-medium uppercase tracking-eyebrow",
        text,
        className ?? "",
      ].join(" ")}
    >
      <span aria-hidden="true" className={["section-label-dash block h-px", dash].join(" ")} />
      <span>{children}</span>
    </p>
  );
}
