/**
 * Capa de datos del calendario.
 *
 * Esta función es la fuente de verdad de los eventos del calendario.
 * Antes leía de un array hardcodeado (ALL_EVENTS); ahora delega a
 * `fetchMonthEvents` que consulta Supabase.
 *
 * La firma se mantiene idéntica para no romper consumidores
 * existentes (CalendarioPageClient, app/calendario/page.tsx, etc.).
 */

import { fetchMonthEvents } from "@/lib/calendar/queries";
import type { MonthData } from "@/lib/calendar/types";

export async function getMonthEvents(
  year: number,
  month: number,
): Promise<MonthData> {
  return fetchMonthEvents(year, month);
}
