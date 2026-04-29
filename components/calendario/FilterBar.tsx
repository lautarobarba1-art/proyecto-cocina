"use client";

import type { ClassCategory } from "@/lib/calendar/types";

export type CalendarFilter = "all" | ClassCategory;

export interface FilterBarProps {
  value: CalendarFilter;
  onChange: (v: CalendarFilter) => void;
  counts: Record<CalendarFilter, number>;
}

const ITEMS: { key: CalendarFilter; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "adultos", label: "Adultos" },
  { key: "ninos", label: "Niños" },
  { key: "eventos", label: "Eventos" },
];

export function FilterBar({ value, onChange, counts }: FilterBarProps) {
  return (
    <div className="mt-8 flex flex-wrap gap-6" role="toolbar" aria-label="Filtrar por categoría">
      {ITEMS.map((item) => {
        const active = value === item.key;
        return (
          <button
            key={item.key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(item.key)}
            className={[
              "font-mono text-[11px] font-medium uppercase tracking-meta transition-[color,opacity,border-color] duration-200 ease-soft",
              active ? "border-b border-terracota pb-1 text-terracota" : "border-b border-transparent pb-1 text-carbon/50 hover:text-carbon hover:opacity-100",
            ].join(" ")}
          >
            {item.label.toUpperCase()}{" "}
            <span className="font-mono text-[10px] opacity-50">({counts[item.key]})</span>
          </button>
        );
      })}
    </div>
  );
}
