"use client";

import * as React from "react";
import { useInView } from "framer-motion";

import { useReducedMotion } from "@/lib/useReducedMotion";
import { useTypewriter } from "@/lib/useTypewriter";

const TEXT = ["¿Cuándo nos juntamos?"] as const;

export function HomeProximasHeading() {
  const ref = React.useRef<HTMLHeadingElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduced = useReducedMotion();

  const { texts, done, active } = useTypewriter(TEXT, inView, reduced, { speed: 45 });

  return (
    <h2
      ref={ref}
      id="home-proximas-heading"
      className="mb-6 font-display text-[clamp(1.5rem,3vw,2rem)] font-normal italic leading-tight tracking-tightish text-carbon"
    >
      {texts[0]}
      {active && !done && (
        <span className="typewriter-cursor text-carbon/40" aria-hidden="true">|</span>
      )}
    </h2>
  );
}
