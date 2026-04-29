"use client";

import Link from "next/link";

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
      <div className="mt-10 flex flex-wrap items-center justify-center gap-8 font-mono text-[10px] font-medium uppercase tracking-meta text-terracota">
        <button type="button" onClick={onPrev} className="transition-opacity hover:opacity-100">
          ← Mes anterior
        </button>
        <button type="button" onClick={onNext} className="transition-opacity hover:opacity-100">
          Mes siguiente →
        </button>
      </div>
      <p className="mt-8">
        <Link href="/contacto" className="font-mono text-[10px] uppercase tracking-meta text-carbon/50 underline decoration-carbon/20 underline-offset-4 hover:text-terracota">
          Escribinos
        </Link>
      </p>
    </div>
  );
}
