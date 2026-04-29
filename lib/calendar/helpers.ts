import { eachDayOfInterval, endOfMonth, endOfWeek, format, isBefore, isSameMonth, isToday, startOfDay, startOfMonth, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";

import type { ClassEvent, MonthData } from "@/lib/calendar/types";

const MONTH_KEYS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const;

export const emptyMessages: Record<string, string> = {
  january: "Enero descansamos.",
  february: "Volvemos en marzo.",
  march: "Marzo arranca despacio.",
  april: "Abril con huecos — mirá el mes próximo.",
  may: "Mayo aún sin fechas.",
  june: "Junio en pausa editorial.",
  july: "Julio: horno frío, cabeza fría.",
  august: "Agosto afuera de la cocina.",
  september: "Septiembre sin planilla.",
  october: "Octubre libre de agenda.",
  november: "Noviembre en silencio.",
  december: "Diciembre: cerramos el año con calma.",
  default: "Este mes no hay clases programadas.",
};

export function monthNameEs(month: number): string {
  const d = new Date(2000, month - 1, 1);
  return format(d, "LLLL", { locale: es });
}

export function getEmptyMessageForMonth(month: number): string {
  const key = MONTH_KEYS[month - 1];
  return emptyMessages[key] ?? emptyMessages.default;
}

/** Días del calendario (lun–dom) que cubren el mes, en bloques de semanas completas. */
export function getMonthCalendarDays(year: number, month: number): Date[] {
  const first = new Date(year, month - 1, 1);
  const monthStart = startOfMonth(first);
  const monthEnd = endOfMonth(first);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  return eachDayOfInterval({ start: gridStart, end: gridEnd });
}

export function chunkWeeks(days: Date[]): Date[][] {
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

export function isPastDay(date: Date): boolean {
  return isBefore(startOfDay(date), startOfDay(new Date()));
}

export function eventsOnDate(events: ClassEvent[], date: Date): ClassEvent[] {
  const key = format(date, "yyyy-MM-dd");
  return events.filter((e) => e.date === key);
}

export function emptyMonth(year: number, month: number): MonthData {
  return {
    year,
    month,
    monthName: monthNameEs(month),
    events: [],
  };
}

export function formatListDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return format(d, "dd.MM", { locale: es });
}

export function formatPreviewDateLabel(dateStr: string, start: string, end: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const w = format(d, "EEE", { locale: es }).toUpperCase();
  const day = format(d, "d", { locale: es });
  const mon = format(d, "MMMM", { locale: es }).toUpperCase();
  const st = start.replace(":", "");
  const en = end.replace(":", "");
  return `${w} · ${day} ${mon} · ${st}-${en}HS`;
}

/** `?clase=slug-dd-mm` (día y mes del evento, año desde `?mes=`). */
export function encodeClaseParam(e: ClassEvent): string {
  const [, m, d] = e.date.split("-");
  return `${e.slug}-${d}-${m}`;
}

export function findEventByClaseParam(param: string | null | undefined, year: number, month: number, pool: ClassEvent[]): ClassEvent | undefined {
  if (!param) return undefined;
  const m = param.match(/^(.+)-(\d{2})-(\d{2})$/);
  if (!m) return undefined;
  const slug = m[1];
  const day = m[2];
  const mo = m[3];
  const date = `${year}-${mo}-${day}`;
  return pool.find((e) => e.slug === slug && e.date === date);
}

export function parseMesParam(value: string | null | undefined): { year: number; month: number } | null {
  if (!value) return null;
  const m = value.match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return { year, month };
}

export { isSameMonth, isToday };
