"use client";

import * as React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";

import type { ClassEvent } from "@/lib/calendar/types";
import { isPastDay, isToday } from "@/lib/calendar/helpers";

export interface DayCellProps {
  date: Date;
  events: ClassEvent[];
  isCurrentMonth: boolean;
  onSelect: (date: Date, events: ClassEvent[]) => void;
  selectedKey: string | null;
  index: number;
  compact?: boolean;
  tabIndex?: number;
  onKeyDown?: React.KeyboardEventHandler<HTMLButtonElement>;
}

function dayKey(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export const DayCell = React.forwardRef<HTMLButtonElement, DayCellProps>(function DayCell(
  { date, events, isCurrentMonth, onSelect, selectedKey, index, compact, tabIndex = -1, onKeyDown },
  ref,
) {
  const key = dayKey(date);
  const has = events.length > 0;
  const past = isPastDay(date);
  const today = isToday(date);
  const selected = selectedKey === key;
  const inMonth = isCurrentMonth;

  const aria = `${format(date, "d 'de' MMMM", { locale: es })}${has ? `, ${events.length} clase${events.length > 1 ? "s" : ""} disponible` : ", sin clases"}`;

  return (
    <td className={["relative border-b border-r border-carbon/10 p-0 align-top last:border-r-0", !inMonth ? "bg-crema-deep/30" : ""].join(" ")}>
      <motion.button
        ref={ref}
        type="button"
        initial={{ opacity: 0, y: 6 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-5% 0px" }}
        transition={{ duration: 0.35, delay: Math.min(index, 20) * 0.03, ease: [0.25, 0.46, 0.45, 0.94] }}
        onClick={() => has && onSelect(date, events)}
        tabIndex={tabIndex}
        aria-disabled={!has}
        onKeyDown={onKeyDown}
        aria-label={aria}
        aria-pressed={has ? selected : undefined}
        className={[
          "flex min-h-[110px] w-full flex-col items-stretch p-3 text-left transition-[background-color,border-color] duration-200 ease-soft",
          today ? "bg-terracota-muted/50" : "",
          has ? "cursor-pointer hover:bg-terracota-muted/60" : "pointer-events-none cursor-default",
          past ? "opacity-40" : "",
          selected ? "border-2 border-terracota" : "border-2 border-transparent",
          !inMonth ? "opacity-50" : "",
        ].join(" ")}
      >
        <span
          className={[
            "font-display text-[18px] leading-none",
            has ? "text-[20px] italic text-terracota" : "text-carbon/40",
          ].join(" ")}
        >
          {format(date, "d")}
        </span>
        {has && !compact ? (
          <div className="mt-2 min-w-0 flex-1 font-mono text-[10px] font-medium uppercase tracking-meta text-carbon/75">
            <p className="truncate">{events[0]?.startTime}</p>
            <p className="mt-0.5 truncate">
              {events[0]?.title.slice(0, 18)}
              {events[0] && events[0].title.length > 18 ? "…" : ""}
            </p>
          </div>
        ) : null}
        {has && compact ? (
          <span className="mt-auto self-end font-mono text-terracota" aria-hidden="true">
            ·
          </span>
        ) : null}
        {has && !compact ? (
          <span className="mt-auto self-end text-[10px] text-terracota" aria-hidden="true">
            ●
          </span>
        ) : null}
      </motion.button>
    </td>
  );
});
