"use client";

import { Button } from "@/components/ui/Button";
import { getEmptyMessageForMonth } from "@/lib/calendar/helpers";

export interface EmptyMonthProps {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
}

export function EmptyMonth({ year, month, onPrev, onNext }: EmptyMonthProps) {
  const headline = getEmptyMessageForMonth(month);

  return (
    <div className="py-24 text-center">
      <span className="sr-only">
        {year} · {month}
      </span>
      <p className="font-display text-[clamp(2rem,4vw,3rem)] font-normal italic text-carbon">{headline}</p>
      <p className="mx-auto mt-6 max-w-[420px] font-display text-[1.05rem] leading-relaxed text-carbon/70">
        Mientras tanto, podés mirar el mes próximo o escribirnos para una clase privada.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-8">
        <Button variant="ghost" size="sm" onClick={onPrev}>
          ← Mes anterior
        </Button>
        <Button variant="ghost" size="sm" onClick={onNext}>
          Mes siguiente →
        </Button>
      </div>
      <p className="mt-8">
        <Button href="/contacto" variant="ghost" size="sm">
          Escribinos
        </Button>
      </p>
    </div>
  );
}
