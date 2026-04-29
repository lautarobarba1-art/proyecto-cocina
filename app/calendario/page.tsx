import type { Metadata } from "next";

import type { CalendarFilter } from "@/components/calendario/FilterBar";
import { CalendarioPageGate } from "@/components/calendario/CalendarioPageGate";
import { JsonLdEvents } from "@/components/calendario/JsonLdEvents";
import type { CalendarView } from "@/components/calendario/ViewToggle";
import { getMonthEvents } from "@/lib/calendar/data";
import { findEventByClaseParam, parseMesParam } from "@/lib/calendar/helpers";

export const metadata: Metadata = {
  title: "Calendario — Menesteres",
  description:
    "Las próximas clases de cocina en Menesteres. Fechas, cupos y reservas para clases de adultos, niños y eventos privados en Rafaela.",
  openGraph: {
    title: "Calendario — Menesteres",
    description: "Mirá las próximas clases y reservá tu lugar.",
    type: "website",
  },
};

export const dynamic = "force-dynamic";

function asString(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1;

  const mesStr = asString(sp.mes);
  const parsedMes = parseMesParam(mesStr);
  if (parsedMes) {
    year = parsedMes.year;
    month = parsedMes.month;
  }

  const monthData = await getMonthEvents(year, month);

  const vista = asString(sp.vista);
  const initialView: CalendarView = vista === "lista" ? "list" : "grid";

  const cat = asString(sp.categoria);
  const initialFilter: CalendarFilter =
    cat === "adultos" || cat === "ninos" || cat === "eventos" ? cat : "all";

  const clase = asString(sp.clase);
  const initialSelectedClassId = findEventByClaseParam(clase, year, month, monthData.events)?.id ?? null;

  return (
    <>
      <JsonLdEvents events={monthData.events} />
      <CalendarioPageGate
        initialYear={year}
        initialMonth={month}
        initialView={initialView}
        initialFilter={initialFilter}
        initialSelectedClassId={initialSelectedClassId}
        initialMonthData={monthData}
      />
    </>
  );
}
