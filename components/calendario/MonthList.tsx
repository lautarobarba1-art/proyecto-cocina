"use client";

import * as React from "react";

import { ClassPreview } from "@/components/calendario/ClassPreview";
import { WaitlistBlock } from "@/components/calendario/WaitlistBlock";
import type { ClassEvent } from "@/lib/calendar/types";
import { formatListDate } from "@/lib/calendar/helpers";

function statusPill(event: ClassEvent): { label: string; className: string } {
  if (event.status === "full") return { label: "Lleno", className: "border border-carbon/40 bg-transparent text-carbon/60" };
  if (event.status === "cancelled") return { label: "Cancelada", className: "border border-carbon/20 text-carbon/45" };
  if (event.status === "few-spots") return { label: "Pocos lugares", className: "bg-terracota text-crema" };
  if (event.spotsLeft != null) return { label: `${event.spotsLeft} cupos`, className: "bg-carbon text-crema" };
  return { label: "Cupos", className: "bg-carbon text-crema" };
}

export interface MonthListProps {
  events: ClassEvent[];
  selectedClassId: string | null;
  onSelectClass: (id: string) => void;
  onClosePanel: () => void;
}

export function MonthList({ events, selectedClassId, onSelectClass, onClosePanel }: MonthListProps) {
  const selected = events.find((e) => e.id === selectedClassId) ?? null;

  return (
    <ol className="list-none p-0" aria-label="Clases del mes en orden cronológico">
      {events.map((event) => {
        const active = selectedClassId === event.id;
        const full = event.status === "full";
        const pill = statusPill(event);
        return (
          <li key={event.id} className="border-b border-dashed border-carbon/15">
            <button
              type="button"
              onClick={() => onSelectClass(event.id)}
              className={[
                "agenda-row grid w-full max-w-full cursor-pointer gap-x-4 gap-y-1 border-0 bg-transparent py-5 text-left transition-[padding-left] duration-200 ease-snap md:grid-cols-[110px_1fr_auto_auto] md:items-baseline",
                "grid-cols-[80px_1fr] pl-0 hover:pl-2 md:hover:pl-2",
              ].join(" ")}
            >
              <span
                className={[
                  "font-display text-[1.85rem] font-normal italic leading-none text-terracota md:text-[1.85rem]",
                  full ? "text-carbon/50 line-through opacity-40" : "",
                ].join(" ")}
              >
                {formatListDate(event.date)}
              </span>
              <span
                className={[
                  "min-w-0 font-display text-[1.2rem] font-normal leading-snug text-carbon md:col-start-2",
                  full ? "text-carbon/50 line-through opacity-40" : "",
                ].join(" ")}
              >
                {event.title}
                {event.isHighlighted ? (
                  <span className="ml-2 font-script text-base text-terracota md:inline">— destacada</span>
                ) : null}
                <span className="mt-1 block font-mono text-[10px] font-medium uppercase tracking-meta text-carbon/55 md:hidden">
                  {event.startTime} — {event.endTime}
                </span>
              </span>
              <span className="hidden font-mono text-[10px] font-medium uppercase tracking-meta text-carbon/55 md:col-start-3 md:block">
                {event.startTime} — {event.endTime}
              </span>
              <span className="hidden justify-self-end md:col-start-4 md:block">
                <span className={`inline-block rounded-sm px-2 py-1 font-mono text-[10px] font-medium uppercase tracking-meta ${pill.className}`}>
                  {pill.label}
                </span>
              </span>
              <span className="col-span-2 justify-self-start md:hidden">
                <span className={`inline-block rounded-sm px-2 py-1 font-mono text-[10px] font-medium uppercase tracking-meta ${pill.className}`}>
                  {pill.label}
                </span>
              </span>
            </button>
            {active && selected ? (
              full ? (
                <WaitlistBlock event={selected} onClose={onClosePanel} />
              ) : (
                <ClassPreview event={selected} onClose={onClosePanel} />
              )
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
