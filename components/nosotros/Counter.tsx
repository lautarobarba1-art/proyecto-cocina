"use client";

import * as React from "react";
import { useInView } from "framer-motion";

import { useReducedMotion } from "@/lib/useReducedMotion";

export interface CounterProps {
  /** Valor final numérico (sin separadores). */
  target: number;
  /** Presentación (ej. miles con separador local). */
  format?: (n: number) => string;
  className?: string;
}

function defaultFormat(n: number): string {
  return n.toLocaleString("es-AR", { maximumFractionDigits: 0 });
}

export function Counter({ target, format = defaultFormat, className }: CounterProps) {
  const reduced = useReducedMotion();
  const ref = React.useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const [value, setValue] = React.useState(() => (reduced ? target : 0));

  React.useEffect(() => {
    if (reduced) {
      setValue(target);
      return;
    }
    if (!inView) return;

    setValue(0);
    const duration = 1400;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setValue(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduced, target]);

  return (
    <span ref={ref} className={className ?? ""}>
      {format(value)}
    </span>
  );
}
