"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { addMonths, format } from "date-fns";

import { BrandIllustration } from "@/components/ui/BrandIllustration";
import { BrandPatternBackground } from "@/components/ui/BrandPatternBackground";
import { CalendarDayLinks } from "@/components/calendario/CalendarDayLinks";
import { CalendarHeader } from "@/components/calendario/CalendarHeader";
import { CalendarLegend } from "@/components/calendario/CalendarLegend";
import type { CalendarFilter } from "@/components/calendario/FilterBar";
import { FilterBar } from "@/components/calendario/FilterBar";
import { MonthGrid } from "@/components/calendario/MonthGrid";
import { MonthList } from "@/components/calendario/MonthList";
import { MobileCalendarView } from "@/components/calendario/MobileCalendarView";
import type { CalendarView } from "@/components/calendario/ViewToggle";
import { ViewToggle } from "@/components/calendario/ViewToggle";
import { EmptyMonth } from "@/components/calendario/EmptyMonth";
import { ClassPreview } from "@/components/calendario/ClassPreview";
import { encodeClaseParam } from "@/lib/calendar/helpers";
import { isPrivateCalendarEvent } from "@/lib/calendar/event-ui";
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
  selectedDateKey: string | null;
  selectedEvent: ClassEvent | null;
  events: ClassEvent[];
}): string {
  const p = new URLSearchParams();
  p.set("mes", `${input.year}-${String(input.month).padStart(2, "0")}`);
  p.set("vista", input.view === "list" ? "lista" : "grilla");
  if (input.filter !== "all") p.set("categoria", input.filter);
  if (input.selectedEvent) {
    p.set("clase", encodeClaseParam(input.selectedEvent));
  } else if (input.selectedDateKey) {
    const ev = input.events.find((e) => e.date === input.selectedDateKey);
    if (ev) p.set("clase", encodeClaseParam(ev));
  }
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

  const initialSelectedDate = React.useMemo(() => {
    if (!initialSelectedClassId) return null;
    return (
      initialMonthData.events.find((e) => e.id === initialSelectedClassId)?.date ??
      null
    );
  }, [initialSelectedClassId, initialMonthData.events]);

  const initialPreviewEvent = React.useMemo(() => {
    if (!initialSelectedClassId) return null;
    const ev = initialMonthData.events.find((e) => e.id === initialSelectedClassId);
    return ev && isPrivateCalendarEvent(ev) ? ev : null;
  }, [initialSelectedClassId, initialMonthData.events]);

  const [year, setYear] = React.useState(initialYear);
  const [month, setMonth] = React.useState(initialMonth);
  const [view, setView] = React.useState<CalendarView>(initialView);
  const [filter, setFilter] = React.useState<CalendarFilter>(initialFilter);
  const [selectedDateKey, setSelectedDateKey] = React.useState<string | null>(
    initialSelectedDate,
  );
  const [selectedEvent, setSelectedEvent] = React.useState<ClassEvent | null>(
    initialPreviewEvent,
  );
  const [mobileFocusDate, setMobileFocusDate] = React.useState<string | null>(null);
  const [monthData, setMonthData] = React.useState<MonthData>(initialMonthData);

  React.useLayoutEffect(() => {
    if (isNarrow) setView("list");
  }, [isNarrow]);

  React.useEffect(() => {
    setMobileFocusDate(null);
    setSelectedDateKey(null);
    setSelectedEvent(null);
    let cancelled = false;
    void fetchMonthEventsClient(year, month).then((d) => {
      if (!cancelled) setMonthData(d);
    });
    return () => {
      cancelled = true;
    };
  }, [year, month]);

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
    if (!selectedEvent) return;
    if (!filtered.some((e) => e.id === selectedEvent.id)) setSelectedEvent(null);
  }, [filtered, selectedEvent]);

  React.useEffect(() => {
    if (!selectedDateKey) return;
    if (!filtered.some((e) => e.date === selectedDateKey)) setSelectedDateKey(null);
  }, [filtered, selectedDateKey]);

  const selectedDayEvents = React.useMemo(
    () =>
      selectedDateKey
        ? filtered.filter((e) => e.date === selectedDateKey)
        : [],
    [filtered, selectedDateKey],
  );

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

  const onSelectPrivateEvent = React.useCallback((event: ClassEvent) => {
    setSelectedEvent(event);
    setSelectedDateKey(event.date);
    setMobileFocusDate(event.date);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const onClosePreview = React.useCallback(() => {
    setSelectedEvent(null);
  }, []);

  const onSelectDay = React.useCallback(
    (date: Date, dayEvents: ClassEvent[]) => {
      const sorted = [...dayEvents].sort((a, b) =>
        a.startTime.localeCompare(b.startTime),
      );

      if (sorted.length === 1) {
        const e = sorted[0]!;
        if (isPrivateCalendarEvent(e)) {
          onSelectPrivateEvent(e);
          return;
        }
        router.push(
          `/clases/${e.slug}?fecha=${encodeURIComponent(e.date)}`,
        );
        return;
      }

      const key = format(date, "yyyy-MM-dd");
      setSelectedEvent(null);
      setSelectedDateKey((prev) => (prev === key ? null : key));
    },
    [router, onSelectPrivateEvent],
  );

  const onCloseDayPanel = React.useCallback(() => {
    setSelectedDateKey(null);
    setSelectedEvent(null);
  }, []);

  const lastQs = React.useRef<string | null>(null);
  const effectiveView: CalendarView = isNarrow ? "list" : view;

  React.useEffect(() => {
    const qs = buildQueryString({
      year,
      month,
      view: effectiveView,
      filter,
      selectedDateKey,
      selectedEvent,
      events: monthData.events,
    });
    if (lastQs.current === qs) return;
    lastQs.current = qs;
    router.replace(`${pathname}?${qs}`, { scroll: false });
  }, [
    year,
    month,
    effectiveView,
    filter,
    selectedDateKey,
    selectedEvent,
    monthData.events,
    pathname,
    router,
  ]);

  const gridBlock = (
    <>
      <MonthGrid
        year={year}
        month={month}
        events={filtered}
        selectedDateKey={selectedDateKey}
        onSelectDay={onSelectDay}
      />
      {selectedDateKey && selectedDayEvents.length > 0 ? (
        <CalendarDayLinks
          dateKey={selectedDateKey}
          events={selectedDayEvents}
          onClose={onCloseDayPanel}
          onSelectPrivateEvent={onSelectPrivateEvent}
        />
      ) : null}
      <CalendarLegend />
    </>
  );

  return (
    <main className="relative flex-1 bg-crema pb-20 lg:pb-28">
      <BrandPatternBackground
        src="/patrones/carpeta-patrones/Mesa%20de%20trabajo%2011.png"
        opacity={0.03}
        tileSize={380}
      />
      <CalendarHeader
        year={year}
        month={month}
        onPrev={goPrevMonth}
        onNext={goNextMonth}
        prevDisabled={prevDisabled}
        nextDisabled={nextDisabled}
      />

      <div className="relative mx-auto max-w-[1280px] px-8 pb-12 pt-4 lg:px-10">
        {selectedEvent ? (
          <ClassPreview event={selectedEvent} onClose={onClosePreview} />
        ) : null}

        <div className="relative">
          <BrandIllustration
            src="/brand-elements/menesteres-elements/espatula-menesteres.svg"
            size={56}
            opacity={0.14}
            rotate={10}
            hideOnMobile
            className="absolute right-0 -top-1"
          />
          <FilterBar value={filter} onChange={setFilter} counts={counts} />
        </div>
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
              onSelectPrivateEvent={onSelectPrivateEvent}
            />
          ) : view === "list" ? (
            <MonthList
              events={filtered}
              onSelectPrivateEvent={onSelectPrivateEvent}
            />
          ) : (
            gridBlock
          )}
        </div>
      </div>
    </main>
  );
}
