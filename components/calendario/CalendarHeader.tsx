"use client";

import * as React from "react";
import { addMonths, format, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { useInView } from "framer-motion";

import { SectionLabel } from "@/components/ui/SectionLabel";
import { useReducedMotion } from "@/lib/useReducedMotion";

export interface CalendarHeaderProps {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  prevDisabled: boolean;
  nextDisabled: boolean;
}

export function CalendarHeader({ year, month, onPrev, onNext, prevDisabled, nextDisabled }: CalendarHeaderProps) {
  const reduced = useReducedMotion();
  const titleRef = React.useRef<HTMLHeadingElement | null>(null);
  const titleInView = useInView(titleRef, { once: true, margin: "0px 0px -15% 0px" });

  const current = new Date(year, month - 1, 1);
  const prev = subMonths(current, 1);
  const next = addMonths(current, 1);
  const prevName = format(prev, "LLLL", { locale: es });
  const nextName = format(next, "LLLL", { locale: es });
  const centerMonth = format(current, "LLLL", { locale: es });

  return (
    <header className="bg-crema px-8 py-20 lg:px-10 lg:py-28">
      <div className="mx-auto max-w-[1280px]">
        <SectionLabel>Agenda</SectionLabel>

        <h1
          ref={titleRef}
          data-inview={titleInView ? "true" : "false"}
          data-reduced={reduced ? "true" : "false"}
          className="section-title mt-8 font-display text-[clamp(2.5rem,5vw,4rem)] font-normal leading-[0.95] tracking-tighter text-carbon"
        >
          Nuestro <em>almanaque</em>.
        </h1>
        <p className="mt-4 max-w-[560px] font-display text-[clamp(1.1rem,1.8vw,1.35rem)] font-normal italic leading-snug text-carbon/70">
          Las próximas clases, encuentros y eventos en nuestra cocina. Mes a mes, sin sorpresas.
        </p>

        <div className="mt-12 flex flex-wrap items-end justify-between gap-6 border-t border-carbon/20 pt-6">
          <div className="flex min-w-0 flex-1 items-baseline gap-3">
            <button
              type="button"
              onClick={onPrev}
              disabled={prevDisabled}
              className="group flex shrink-0 items-baseline gap-2 font-mono text-[11px] uppercase tracking-meta text-carbon/50 transition-[gap,opacity] duration-200 ease-snap hover:gap-3 hover:opacity-100 disabled:pointer-events-none disabled:opacity-25"
              aria-label="Mes anterior"
            >
              <span aria-hidden="true">←</span>
              <span className="hidden truncate sm:inline">{prevName}</span>
            </button>
          </div>
          <div className="text-center">
            <p className="font-display text-[clamp(2rem,4vw,3rem)] font-normal italic capitalize text-terracota">
              {centerMonth}
            </p>
            <p className="mt-1 font-mono text-[10px] font-medium uppercase tracking-meta text-carbon/55">{year}</p>
          </div>
          <div className="flex min-w-0 flex-1 items-baseline justify-end gap-3">
            <button
              type="button"
              onClick={onNext}
              disabled={nextDisabled}
              className="group flex shrink-0 items-baseline gap-2 font-mono text-[11px] uppercase tracking-meta text-carbon/50 transition-[gap,opacity] duration-200 ease-snap hover:gap-3 hover:opacity-100 disabled:pointer-events-none disabled:opacity-25"
              aria-label="Mes siguiente"
            >
              <span className="hidden truncate sm:inline">{nextName}</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
