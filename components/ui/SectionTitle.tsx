"use client";

import * as React from "react";
import { useInView } from "framer-motion";

import { useReducedMotion } from "@/lib/useReducedMotion";

export interface SectionTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionTitle({ children, className }: SectionTitleProps) {
  const reduced = useReducedMotion();
  const ref = React.useRef<HTMLHeadingElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -20% 0px" });

  return (
    <h2
      ref={ref}
      data-inview={inView ? "true" : "false"}
      data-reduced={reduced ? "true" : "false"}
      className={[
        "section-title max-w-[min(100%,42rem)] text-balance font-display text-3xl font-normal leading-[1.05] tracking-tightish text-carbon sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </h2>
  );
}

