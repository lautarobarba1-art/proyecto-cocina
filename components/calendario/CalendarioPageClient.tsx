"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { addMonths } from "date-fns";

import { CalendarHeader } from "@/components/calendario/CalendarHeader";
import { CalendarLegend } from "@/components/calendario/CalendarLegend";
import { ClassPreview } from "@/components/calendario/ClassPreview";
import type { CalendarFilter } from "@/components/calendario/FilterBar";
import { FilterBar } from "@/components/calendario/FilterBar";
import { MonthGrid } from "@/components/calendario/MonthGrid";
import { MonthList } from "@/components/calendario/MonthList";
import { MobileCalendarView } from "@/components/calendario/MobileCalendarView";
import type { CalendarView } from "@/components/calendario/ViewToggle";
import { ViewToggle } from "@/components/calendario/ViewToggle";
import { EmptyMonth } from "@/components/calendario/EmptyMonth";
import { WaitlistBlock } from "@/components/calendario/WaitlistBlock";
import { encodeClaseParam } from "@/lib/calendar/helpers";
import type { ClassEvent, MonthData } from "@/lib/calendar/types";

async function fetchMonthEventsClient(year: number, month: number): Promise<MonthData> {
  const res = await fetch(
    `/api/calendar/month?year=${encodeURIComponent(String(year))}&month=${encodeURIComponent(String(month))}`,
    { cache: "no-store" },
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = typeof body?.error === "string" ? body.error : res.statusText;
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return res.json() as Promise<MonthData>;
}

/** &lt;700px: list-only view (CalendarioPageClient is client-only via `dynamic(..., { ssr: false })`). */
function useNarrowCalendar(): boolean {
  const [narrow, setNarrow] = React.useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 699px)").matches : false,
  );
  React.useLayoutEffect(() => {
    const mq = window.matchMedia("(max-width: 699px)");
    const apply = () => setNarrow(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return narrow;
}

function monthIndex(y: number, m: number): number {
  return y * 12 + (m - 1);
}

function buildQueryString(input: {
  year: number;
  month: number;
  view: CalendarView;
  filter: CalendarFilter;
  selectedClassId: string | null;
  events: ClassEvent[];
}): string {
  const p = new URLSearchParams();
  p.set("mes", `${input.year}-${String(input.month).padStart(2, "0")}`);
  p.set("vista", input.view === "list" ? "lista" : "grilla");
  if (input.filter !== "all") p.set("categoria", input.filter);
  const ev = input.selectedClassId ? input.events.find((e) => e.id === input.selectedClassId) : undefined;
  if (ev) p.set("clase", encodeClaseParam(ev));
  return p.toString();
}

export interface CalendarioPageClientProps {
  initialYear: number;
  initialMonth: number;
  initialView: CalendarView;
  initialFilter: CalendarFilter;
  initialSelectedClassId: string | null;
  initialMonthData: MonthData;
}

export function CalendarioPageClient({
  initialYear,
  initialMonth,
  initialView,
  initialFilter,
  initialSelectedClassId,
  initialMonthData,
}: CalendarioPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isNarrow = useNarrowCalendar();

  const [year, setYear] = React.useState(initialYear);
  const [month, setMonth] = React.useState(initialMonth);
  const [view, setView] = React.useState<CalendarView>(initialView);
  const [filter, setFilter] = React.useState<CalendarFilter>(initialFilter);
  const [selectedClassId, setSelectedClassId] = React.useState<string | null>(initialSelectedClassId);
  const [mobileFocusDate, setMobileFocusDate] = React.useState<string | null>(null);
  const [monthData, setMonthData] = React.useState<MonthData>(initialMonthData);

  React.useLayoutEffect(() => {
    if (isNarrow) setView("list");
  }, [isNarrow]);

  React.useEffect(() => {
    setMobileFocusDate(null);
    setSelectedClassId(null);
    let cancelled = false;
    void fetchMonthEventsClient(year, month).then((d) => {
      if (!cancelled) setMonthData(d);
    });
    return () => {
      cancelled = true;
    };
  }, [year, month]);

  React.useEffect(() => {
    if (!selectedClassId) return;
    const still = monthData.events.some((e) => e.id === selectedClassId);
    if (!still) setSelectedClassId(null);
  }, [monthData.events, selectedClassId]);

  const counts = React.useMemo(() => {
    const ev = monthData.events;
    return {
      all: ev.length,
      adultos: ev.filter((e) => e.category === "adultos").length,
      ninos: ev.filter((e) => e.category === "ninos").length,
      eventos: ev.filter((e) => e.category === "eventos").length,
    } satisfies Record<CalendarFilter, number>;
  }, [monthData.events]);

  const filtered = React.useMemo(() => {
    if (filter === "all") return monthData.events;
    return monthData.events.filter((e) => e.category === filter);
  }, [monthData.events, filter]);

  React.useEffect(() => {
    if (!selectedClassId) return;
    if (!filtered.some((e) => e.id === selectedClassId)) setSelectedClassId(null);
  }, [filtered, selectedClassId]);

  const selectedEvent = React.useMemo(
    () => (selectedClassId ? monthData.events.find((e) => e.id === selectedClassId) ?? null : null),
    [monthData.events, selectedClassId],
  );

  const selectedDateKey = selectedEvent?.date ?? null;

  const today = new Date();
  const anchorIdx = monthIndex(today.getFullYear(), today.getMonth() + 1);
  const curIdx = monthIndex(year, month);
  const prevDisabled = curIdx <= anchorIdx - 6;
  const nextDisabled = curIdx >= anchorIdx + 6;

  const goPrevMonth = React.useCallback(() => {
    const d = addMonths(new Date(year, month - 1, 1), -1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  }, [year, month]);

  const goNextMonth = React.useCallback(() => {
    const d = addMonths(new Date(year, month - 1, 1), 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  }, [year, month]);

  const onSelectDay = React.useCallback((_date: Date, dayEvents: ClassEvent[]) => {
    const sorted = [...dayEvents].sort((a, b) => a.startTime.localeCompare(b.startTime));
    const chosen = sorted[0];
    if (chosen) setSelectedClassId(chosen.id);
  }, []);

  const onSelectClass = React.useCallback((id: string) => {
    setSelectedClassId((prev) => (prev === id ? null : id));
  }, []);

  const onClosePanel = React.useCallback(() => setSelectedClassId(null), []);

  const lastQs = React.useRef<string | null>(null);
  const effectiveView: CalendarView = isNarrow ? "list" : view;

  React.useEffect(() => {
    const qs = buildQueryString({
      year,
      month,
      view: effectiveView,
      filter,
      selectedClassId,
      events: monthData.events,
    });
    if (lastQs.current === qs) return;
    lastQs.current = qs;
    router.replace(`${pathname}?${qs}`, { scroll: false });
  }, [year, month, effectiveView, filter, selectedClassId, monthData.events, pathname, router]);

  const gridBlock = (
    <>
      <MonthGrid year={year} month={month} events={filtered} selectedDateKey={selectedDateKey} onSelectDay={onSelectDay} />
      {selectedEvent ? (
        selectedEvent.status === "full" ? (
          <WaitlistBlock event={selectedEvent} onClose={onClosePanel} />
        ) : (
          <ClassPreview event={selectedEvent} onClose={onClosePanel} />
        )
      ) : null}
      <CalendarLegend />
    </>
  );

  return (
    <main className="flex-1 bg-crema pb-20 lg:pb-28">
      <CalendarHeader
        year={year}
        month={month}
        onPrev={goPrevMonth}
        onNext={goNextMonth}
        prevDisabled={prevDisabled}
        nextDisabled={nextDisabled}
      />

      <div className="mx-auto max-w-[1280px] px-8 pb-12 pt-4 lg:px-10">
        <FilterBar value={filter} onChange={setFilter} counts={counts} />
        <div className="hidden min-[700px]:block">
          <ViewToggle value={view} onChange={setView} />
        </div>

        <div
          id="panel-calendario"
          className="mt-10"
          role="tabpanel"
          aria-label="Agenda del mes"
          aria-labelledby="tab-vista-grilla tab-vista-lista"
        >
          {monthData.events.length === 0 ? (
            <EmptyMonth year={year} month={month} onPrev={goPrevMonth} onNext={goNextMonth} />
          ) : filtered.length === 0 ? (
            <p className="py-16 text-center font-display text-[1.1rem] text-carbon/70">
              No hay clases en esta categoría este mes. Probá otra etiqueta.
            </p>
          ) : isNarrow ? (
            <MobileCalendarView
              year={year}
              month={month}
              events={filtered}
              focusDate={mobileFocusDate}
              onDayFocus={(dateKey) => setMobileFocusDate(dateKey)}
            />
          ) : view === "list" ? (
            <MonthList events={filtered} selectedClassId={selectedClassId} onSelectClass={onSelectClass} onClosePanel={onClosePanel} />
          ) : (
            gridBlock
          )}
        </div>
      </div>
    </main>
  );
}
