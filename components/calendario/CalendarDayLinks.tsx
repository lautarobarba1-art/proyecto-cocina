"use client";

import Link from "next/link";

import type { ClassEvent } from "@/lib/calendar/types";
import { formatDayHeader } from "@/lib/calendar/day-format";
import {
  calendarEventHref,
  calendarEventStatusPill,
  isPrivateCalendarEvent,
} from "@/lib/calendar/event-ui";

export interface CalendarDayLinksProps {
  dateKey: string;
  events: ClassEvent[];
  onClose: () => void;
  onSelectPrivateEvent?: (event: ClassEvent) => void;
}

const rowClassName =
  "block py-4 transition-[padding-left] duration-200 ease-snap hover:pl-2";

export function CalendarDayLinks({
  dateKey,
  events,
  onClose,
  onSelectPrivateEvent,
}: CalendarDayLinksProps) {
  const sorted = [...events].sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div
      role="region"
      aria-label="Actividades del día seleccionado"
      className="relative mt-8 border border-carbon/10 bg-white p-6 md:p-8"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 inline-flex min-h-[44px] min-w-[44px] items-center justify-center font-mono text-xl leading-none text-carbon/40 transition-opacity hover:text-carbon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracota/30"
        aria-label="Cerrar"
      >
        ×
      </button>

      <p className="font-mono text-[0.65rem] font-medium uppercase tracking-eyebrow text-carbon/50">
        {formatDayHeader(dateKey)}
      </p>

      <ol className="mt-5 list-none space-y-0 p-0">
        {sorted.map((event) => {
          const pill = calendarEventStatusPill(event);
          const inner = (
            <>
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-mono text-[10px] font-medium uppercase tracking-meta text-carbon/55">
                  {event.startTime} — {event.endTime}
                </span>
                <span
                  className={[
                    "inline-block rounded-sm px-2 py-0.5 font-mono text-[9px] font-medium uppercase tracking-meta",
                    pill.className,
                  ].join(" ")}
                >
                  {pill.label}
                </span>
              </div>
              <p className="mt-1 font-display text-[1.15rem] font-normal leading-snug text-carbon">
                {event.title}
              </p>
            </>
          );

          return (
            <li key={event.id} className="border-b border-dashed border-carbon/15 last:border-b-0">
              {isPrivateCalendarEvent(event) ? (
                <button
                  type="button"
                  onClick={() => onSelectPrivateEvent?.(event)}
                  className={`w-full text-left ${rowClassName}`}
                >
                  {inner}
                </button>
              ) : (
                <Link href={calendarEventHref(event)} className={rowClassName}>
                  {inner}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
