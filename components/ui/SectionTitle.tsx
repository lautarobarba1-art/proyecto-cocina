"use client";

import * as React from "react";
import { useInView } from "framer-motion";

import { useReducedMotion } from "@/lib/useReducedMotion";

export interface SectionTitleProps {
  children: React.ReactNode;
  className?: string;
  /**
   * `case="upper"` (default) aplica uppercase como en el DS oficial.
   * `case="normal"` lo deja sin transformación (útil en ciertas piezas editoriales).
   */
  case?: "upper" | "normal";
}

export function SectionTitle({ children, className, case: textCase = "upper" }: SectionTitleProps) {
  const reduced = useReducedMotion();
  const ref = React.useRef<HTMLHeadingElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -20% 0px" });

  return (
    <h2
      ref={ref}
      data-inview={inView ? "true" : "false"}
      data-reduced={reduced ? "true" : "false"}
      className={[
        "section-title max-w-[min(100%,42rem)] text-balance font-display font-extrabold leading-[1.05] tracking-tighter text-carbon",
        textCase === "upper" ? "uppercase" : "",
        "text-3xl sm:text-4xl md:text-5xl lg:text-[3rem] xl:text-[3.25rem]",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </h2>
  );
}
