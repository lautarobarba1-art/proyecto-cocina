"use client";

import * as React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { DayCell } from "@/components/calendario/DayCell";
import type { ClassEvent } from "@/lib/calendar/types";
import { chunkWeeks, eventsOnDate, getMonthCalendarDays, isSameMonth } from "@/lib/calendar/helpers";

const WEEKDAYS = ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB", "DOM"] as const;

function useTabletCompact(): boolean {
  return React.useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") return () => {};
      const mq1 = window.matchMedia("(min-width: 700px)");
      const mq2 = window.matchMedia("(max-width: 899px)");
      const fn = () => onStoreChange();
      mq1.addEventListener("change", fn);
      mq2.addEventListener("change", fn);
      return () => {
        mq1.removeEventListener("change", fn);
        mq2.removeEventListener("change", fn);
      };
    },
    () => {
      if (typeof window === "undefined") return false;
      return window.matchMedia("(min-width: 700px)").matches && window.matchMedia("(max-width: 899px)").matches;
    },
    () => false,
  );
}

export interface MonthGridProps {
  year: number;
  month: number;
  events: ClassEvent[];
  selectedDateKey: string | null;
  onSelectDay: (date: Date, dayEvents: ClassEvent[]) => void;
}

export function MonthGrid({ year, month, events, selectedDateKey, onSelectDay }: MonthGridProps) {
  const compact = useTabletCompact();
  const days = React.useMemo(() => getMonthCalendarDays(year, month), [year, month]);
  const weeks = React.useMemo(() => chunkWeeks(days), [days]);
  const totalCells = days.length;
  const refs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const [focusFlat, setFocusFlat] = React.useState(0);

  React.useLayoutEffect(() => {
    const firstWith = days.findIndex((d) => eventsOnDate(events, d).length > 0);
    setFocusFlat(firstWith >= 0 ? firstWith : 0);
  }, [year, month, days, events]);

  const stampMonth = format(new Date(year, month - 1, 1), "MMMM", { locale: es }).toUpperCase();
  const stampCount = events.length;

  const moveFocus = React.useCallback(
    (nextFlat: number) => {
      const clamped = Math.max(0, Math.min(totalCells - 1, nextFlat));
      setFocusFlat(clamped);
      requestAnimationFrame(() => refs.current[clamped]?.focus());
    },
    [totalCells],
  );

  const handleKey = React.useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, flatIndex: number, day: Date, dayEvents: ClassEvent[]) => {
      const cols = 7;
      const rows = weeks.length;
      const row = Math.floor(flatIndex / cols);
      const col = flatIndex % cols;

      if (e.key === "Enter") {
        e.preventDefault();
        if (dayEvents.length) onSelectDay(day, dayEvents);
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (col > 0) moveFocus(flatIndex - 1);
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (col < cols - 1) moveFocus(flatIndex + 1);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (row > 0) moveFocus(flatIndex - cols);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (row < rows - 1) moveFocus(flatIndex + cols);
        return;
      }
      if (e.key === "Home") {
        e.preventDefault();
        moveFocus(0);
        return;
      }
      if (e.key === "End") {
        e.preventDefault();
        moveFocus(totalCells - 1);
        return;
      }
    },
    [moveFocus, onSelectDay, totalCells, weeks.length],
  );

  let flat = 0;

  return (
    <div className="border border-carbon bg-crema-light p-2">
      <table className="w-full border-collapse" role="grid" aria-label={`Calendario de ${stampMonth} ${year}`}>
        <thead>
          <tr>
            {WEEKDAYS.map((d) => (
              <th
                key={d}
                scope="col"
                className="border-b border-carbon/15 py-3 text-center font-mono text-[10px] font-medium uppercase tracking-meta text-carbon/55"
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
                const flatIndex = flat++;
                const dayEvents = eventsOnDate(events, day);
                const inMonth = isSameMonth(day, new Date(year, month - 1, 1));
                return (
                  <DayCell
                    key={day.toISOString()}
                    ref={(el) => {
                      refs.current[flatIndex] = el;
                    }}
                    date={day}
                    events={dayEvents}
                    isCurrentMonth={inMonth}
                    onSelect={onSelectDay}
                    selectedKey={selectedDateKey}
                    index={flatIndex}
                    compact={compact}
                    tabIndex={focusFlat === flatIndex ? 0 : -1}
                    onKeyDown={(e) => handleKey(e, flatIndex, day, dayEvents)}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-right font-mono text-[10px] font-medium uppercase tracking-eyebrow text-carbon/50">
        — {stampCount} {stampCount === 1 ? "evento" : "eventos"} · {stampMonth} —
      </p>
    </div>
  );
}
