"use client";

import Link from "next/link";

import type { ClassEvent } from "@/lib/calendar/types";
import { formatListDate, isPastClassDate } from "@/lib/calendar/helpers";
import {
  calendarEventHref,
  calendarEventStatusPill,
  isPrivateCalendarEvent,
} from "@/lib/calendar/event-ui";

export interface MonthListProps {
  events: ClassEvent[];
  onSelectPrivateEvent?: (event: ClassEvent) => void;
}

export function MonthList({ events, onSelectPrivateEvent }: MonthListProps) {
  return (
    <ol className="list-none p-0" aria-label="Actividades del mes en orden cronológico">
      {events.map((event) => {
        const privateEvent = isPrivateCalendarEvent(event);
        const full =
          !privateEvent &&
          event.status === "full" &&
          !isPastClassDate(event.date);
        const past = isPastClassDate(event.date);
        const pill = calendarEventStatusPill(event);

        const rowInner = (
          <>
            <span
              className={[
                "font-display text-[1.85rem] font-normal italic leading-none text-terracota md:text-[1.85rem]",
                full ? "text-carbon/50 line-through opacity-40" : "",
                past ? "text-carbon/45 not-italic" : "",
                privateEvent && !past ? "not-italic text-carbon/70" : "",
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
                <span className="ml-2 font-script text-base text-terracota md:inline">
                  — destacada
                </span>
              ) : null}
              <span className="mt-1 block font-mono text-[10px] font-medium uppercase tracking-meta text-carbon/55 md:hidden">
                {event.startTime} — {event.endTime}
              </span>
            </span>
            <span className="hidden font-mono text-[10px] font-medium uppercase tracking-meta text-carbon/55 md:col-start-3 md:block">
              {event.startTime} — {event.endTime}
            </span>
            <span className="hidden justify-self-end md:col-start-4 md:block">
              <span
                className={`inline-block rounded-sm px-2 py-1 font-mono text-[10px] font-medium uppercase tracking-meta ${pill.className}`}
              >
                {pill.label}
              </span>
            </span>
            <span className="col-span-2 justify-self-start md:hidden">
              <span
                className={`inline-block rounded-sm px-2 py-1 font-mono text-[10px] font-medium uppercase tracking-meta ${pill.className}`}
              >
                {pill.label}
              </span>
            </span>
          </>
        );

        const rowClass = [
          "agenda-row grid w-full max-w-full gap-x-4 gap-y-1 py-5 text-left transition-[padding-left] duration-200 ease-snap md:grid-cols-[110px_1fr_auto_auto] md:items-baseline",
          "grid-cols-[80px_1fr] pl-0 hover:pl-2 md:hover:pl-2",
          past ? "opacity-60" : "",
        ].join(" ");

        return (
          <li key={event.id} className="border-b border-dashed border-carbon/15">
            {privateEvent ? (
              <button
                type="button"
                onClick={() => onSelectPrivateEvent?.(event)}
                className={rowClass}
              >
                {rowInner}
              </button>
            ) : (
              <Link href={calendarEventHref(event)} className={rowClass}>
                {rowInner}
              </Link>
            )}
          </li>
        );
      })}
    </ol>
  );
}
