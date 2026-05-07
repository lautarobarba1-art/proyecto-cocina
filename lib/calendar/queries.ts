import { getSupabaseAdmin } from "@/lib/supabase/server";
import { classRowToClassEvent, type ClassRow } from "@/lib/calendar/adapters";
import { emptyMonth, monthNameEs } from "@/lib/calendar/helpers";
import type { MonthData } from "@/lib/calendar/types";

/**
 * Obtiene los eventos de un mes específico desde Supabase.
 *
 * Reemplaza el filtrado del array ALL_EVENTS por una query a la vista
 * `classes_with_availability`, que ya calcula spots_left dinámicamente.
 *
 * Mantiene la misma firma que la versión mock para no romper nada
 * en el calendario existente.
 */
export async function fetchMonthEvents(
  year: number,
  month: number,
): Promise<MonthData> {
  const supabase = getSupabaseAdmin();

  // Calcular rango del mes en formato YYYY-MM-DD
  const monthStr = String(month).padStart(2, "0");
  const startDate = `${year}-${monthStr}-01`;
  const lastDay = new Date(year, month, 0).getDate(); // último día del mes
  const endDate = `${year}-${monthStr}-${String(lastDay).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("classes_with_availability")
    .select("*")
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    console.error("[fetchMonthEvents] Error fetching from Supabase:", error);
    throw new Error(`Failed to fetch month events: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return emptyMonth(year, month);
  }

  const events = (data as ClassRow[]).map(classRowToClassEvent);

  return {
    year,
    month,
    monthName: monthNameEs(month),
    events,
  };
}