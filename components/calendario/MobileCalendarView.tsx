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
  isSameMonth,
  isPastDay,
  isToday,
} from "@/lib/calendar/helpers";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MobileCalendarViewProps {
  year: number;
  month: number;
  events: ClassEvent[];
  focusDate: string | null;
  onDayFocus: (dateKey: string) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function dateKey(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function formatDayHeader(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y!, m! - 1, d!);
  const str = date.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Highest-priority dot color for a day with multiple events.
 * available/few-spots → terracota, full → muted, cancelled-only → none
 */
function dotColor(dayEvents: ClassEvent[]): "terracota" | "muted" | "none" {
  if (dayEvents.length === 0) return "none";
  const hasActive = dayEvents.some(
    (e) => e.status === "available" || e.status === "few-spots",
  );
  if (hasActive) return "terracota";
  const hasFull = dayEvents.some((e) => e.status === "full");
  if (hasFull) return "muted";
  return "none"; // all cancelled
}

function statusPill(event: ClassEvent): { label: string; className: string } {
  if (event.status === "full")
    return { label: "Lleno", className: "border border-carbon/40 text-carbon/60" };
  if (event.status === "cancelled")
    return { label: "Cancelada", className: "border border-carbon/20 text-carbon/45" };
  if (event.status === "few-spots")
    return { label: "Pocos lugares", className: "bg-terracota text-crema" };
  if (event.spotsLeft != null)
    return { label: `${event.spotsLeft} cupos`, className: "bg-carbon text-crema" };
  return { label: "Cupos", className: "bg-carbon text-crema" };
}

const WEEKDAYS = ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB", "DOM"] as const;

// ─── Component ───────────────────────────────────────────────────────────────

export function MobileCalendarView({
  year,
  month,
  events,
  focusDate,
  onDayFocus,
}: MobileCalendarViewProps) {
  const days = React.useMemo(() => getMonthCalendarDays(year, month), [year, month]);
  const weeks = React.useMemo(() => chunkWeeks(days), [days]);

  const focusDateEvents = React.useMemo(() => {
    if (!focusDate) return [];
    return events.filter((e) => e.date === focusDate);
  }, [events, focusDate]);

  return (
    <div>
      {/* ── Compact month grid ── */}
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
                      aria-label={`${format(day, "d 'de' MMMM", { locale: es })}${hasEvents ? `, ${dayEvents.length} clase${dayEvents.length > 1 ? "s" : ""}` : ""}`}
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

      {/* ── Day events list ── */}
      {focusDate ? (
        <div className="mt-6">
          <p className="mb-4 font-mono text-[0.65rem] font-medium tracking-eyebrow text-carbon/50">
            {formatDayHeader(focusDate)}
          </p>

          {focusDateEvents.length === 0 ? (
            <p className="py-4 font-body text-[0.9rem] text-carbon/50">
              No hay clases este día.
            </p>
          ) : (
            <ol className="list-none p-0">
              {focusDateEvents.map((event) => {
                const pill = statusPill(event);
                const href = `/clases/${event.slug}?fecha=${encodeURIComponent(event.date)}`;
                return (
                  <li key={event.id} className="border-b border-dashed border-carbon/15">
                    <Link
                      href={href}
                      className="block py-4 transition-[padding-left] duration-200 ease-snap hover:pl-2"
                    >
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
                    </Link>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      ) : (
        <p className="mt-8 text-center font-body text-[0.85rem] text-carbon/40">
          Seleccioná un día para ver las clases.
        </p>
      )}
    </div>
  );
}