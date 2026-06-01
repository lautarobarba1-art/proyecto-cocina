"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import type { ClassEvent } from "@/lib/calendar/types";
import {
  chunkWeeks,
  eventsOnDate,
  getMonthCalendarDays,
  isPastClassDate,
  isSameMonth,
  isPastDay,
  isToday,
} from "@/lib/calendar/helpers";
import { formatDayHeader } from "@/lib/calendar/day-format";
import {
  calendarEventHref,
  calendarEventStatusPill,
  isPrivateCalendarEvent,
} from "@/lib/calendar/event-ui";

export interface MobileCalendarViewProps {
  year: number;
  month: number;
  events: ClassEvent[];
  focusDate: string | null;
  onDayFocus: (dateKey: string) => void;
  onSelectPrivateEvent?: (event: ClassEvent) => void;
}

function dateKey(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function dotColor(dayEvents: ClassEvent[]): "terracota" | "muted" | "none" {
  if (dayEvents.length === 0) return "none";
  const hasActive = dayEvents.some(
    (e) =>
      !isPrivateCalendarEvent(e) &&
      (e.status === "available" || e.status === "few-spots"),
  );
  if (hasActive) return "terracota";
  const hasFull = dayEvents.some(
    (e) => e.status === "full" || isPrivateCalendarEvent(e),
  );
  if (hasFull) return "muted";
  return "none";
}

const WEEKDAYS = ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB", "DOM"] as const;
const rowClassName =
  "block w-full py-4 text-left transition-[padding-left] duration-200 ease-snap hover:pl-2";

export function MobileCalendarView({
  year,
  month,
  events,
  focusDate,
  onDayFocus,
  onSelectPrivateEvent,
}: MobileCalendarViewProps) {
  const days = React.useMemo(() => getMonthCalendarDays(year, month), [year, month]);
  const weeks = React.useMemo(() => chunkWeeks(days), [days]);

  const focusDateEvents = React.useMemo(() => {
    if (!focusDate) return [];
    return events.filter((e) => e.date === focusDate);
  }, [events, focusDate]);

  return (
    <div>
      <table
        className="w-full border-collapse"
        role="grid"
        aria-label={`Calendario de ${format(new Date(year, month - 1, 1), "MMMM yyyy", { locale: es })}`}
      >
        <thead>
          <tr>
            {WEEKDAYS.map((d) => (
              <th
                key={d}
                scope="col"
                className="py-2 text-center font-mono text-[9px] font-medium uppercase tracking-meta text-carbon/45"
              >
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, weekIdx) => (
            <tr key={weekIdx}>
              {week.map((day) => {
                const key = dateKey(day);
                const dayEvents = eventsOnDate(events, day);
                const inMonth = isSameMonth(day, new Date(year, month - 1, 1));
                const past = isPastDay(day);
                const today = isToday(day);
                const focused = focusDate === key;
                const dot = dotColor(dayEvents);
                const hasEvents = dayEvents.length > 0;

                return (
                  <td key={key} className="p-0 text-center">
                    <button
                      type="button"
                      aria-pressed={focused}
                      aria-label={`${format(day, "d 'de' MMMM", { locale: es })}${hasEvents ? `, ${dayEvents.length} actividad${dayEvents.length > 1 ? "es" : ""}` : ""}`}
                      disabled={!hasEvents}
                      onClick={() => hasEvents && onDayFocus(key)}
                      className={[
                        "mx-auto flex w-9 flex-col items-center rounded-full py-1 transition-colors duration-150",
                        hasEvents ? "cursor-pointer" : "cursor-default",
                        focused ? "bg-terracota" : today ? "bg-terracota/10" : "",
                        !inMonth || past ? "opacity-30" : "",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "font-display text-[15px] leading-none",
                          focused
                            ? "font-medium text-crema"
                            : hasEvents
                              ? "italic text-terracota"
                              : "text-carbon/40",
                        ].join(" ")}
                      >
                        {format(day, "d")}
                      </span>
                      <span
                        className={[
                          "mt-0.5 h-1 w-1 rounded-full",
                          dot === "terracota"
                            ? focused
                              ? "bg-crema/70"
                              : "bg-terracota"
                            : dot === "muted"
                              ? "bg-carbon/30"
                              : "bg-transparent",
                        ].join(" ")}
                        aria-hidden="true"
                      />
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {focusDate ? (
        <div className="mt-6">
          <p className="mb-4 font-mono text-[0.65rem] font-medium tracking-eyebrow text-carbon/50">
            {formatDayHeader(focusDate)}
          </p>

          {focusDateEvents.length === 0 ? (
            <p className="py-4 font-body text-[0.9rem] text-carbon/50">
              No hay actividades este día.
            </p>
          ) : (
            <ol className="list-none p-0">
              {focusDateEvents.map((event) => {
                const pill = calendarEventStatusPill(event);
                const inner = (
                  <>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-mono text-[10px] font-medium uppercase tracking-meta text-carbon/55">
                        {event.startTime} — {event.endTime}
                      </span>
                      <span
                        className={`inline-block rounded-sm px-2 py-0.5 font-mono text-[9px] font-medium uppercase tracking-meta ${pill.className}`}
                      >
                        {pill.label}
                      </span>
                    </div>
                    <p className="mt-1 font-display text-[1.1rem] font-normal leading-snug text-carbon">
                      {event.title}
                      {event.isHighlighted ? (
                        <span className="ml-2 font-script text-sm text-terracota">
                          — destacada
                        </span>
                      ) : null}
                    </p>
                  </>
                );

                return (
                  <li key={event.id} className="border-b border-dashed border-carbon/15">
                    {isPrivateCalendarEvent(event) ? (
                      <button
                        type="button"
                        onClick={() => onSelectPrivateEvent?.(event)}
                        className={rowClassName}
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
          )}
        </div>
      ) : (
        <p className="mt-8 text-center font-body text-[0.85rem] text-carbon/40">
          Seleccioná un día para ver las actividades.
        </p>
      )}
    </div>
  );
}
