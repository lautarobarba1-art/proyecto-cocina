"use client";

import * as React from "react";

interface Options {
  speed?: number;
  startDelay?: number;
  pauseBetween?: number;
}

/**
 * Tipos texto caracter a caracter en segmentos consecutivos.
 * `trigger` arranca el countdown; `reduced` muestra todo de golpe.
 */
export function useTypewriter(
  segments: readonly string[],
  trigger: boolean,
  reduced: boolean,
  { speed = 38, startDelay = 0, pauseBetween = 200 }: Options = {}
): { texts: readonly string[]; done: boolean; active: boolean } {
  const [phase, setPhase] = React.useState(0);
  const [charCount, setCharCount] = React.useState(0);
  const [active, setActive] = React.useState(false);

  React.useEffect(() => {
    if (!trigger || reduced) return;
    const t = setTimeout(() => setActive(true), startDelay);
    return () => clearTimeout(t);
  }, [trigger, reduced, startDelay]);

  React.useEffect(() => {
    if (!active) return;
    const seg = segments[phase] ?? "";
    if (charCount < seg.length) {
      const t = setTimeout(() => setCharCount((c) => c + 1), speed);
      return () => clearTimeout(t);
    }
    if (phase < segments.length - 1) {
      const t = setTimeout(() => {
        setPhase((p) => p + 1);
        setCharCount(0);
      }, pauseBetween);
      return () => clearTimeout(t);
    }
  }, [active, phase, charCount, segments, speed, pauseBetween]);

  if (reduced) {
    return { texts: segments, done: true, active: true };
  }

  const texts = segments.map((seg, i) => {
    if (i < phase) return seg;
    if (i === phase) return seg.slice(0, charCount);
    return "";
  });

  const lastSeg = segments[segments.length - 1] ?? "";
  const done = phase === segments.length - 1 && charCount === lastSeg.length;

  return { texts, done, active };
}
