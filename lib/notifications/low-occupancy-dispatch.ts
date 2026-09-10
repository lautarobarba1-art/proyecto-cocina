import type { SupabaseClient } from "@supabase/supabase-js";

import { notifyLowOccupancy, type NotifyDeps } from "./notify.ts";
import { buenosAiresDateInDays } from "../date/reminder-window.ts";
import { siteContact } from "../site/contact.ts";

/**
 * Alerta de baja ocupación: avisa al admin de una clase que es dentro de 4
 * días y va a menos del 40% de sus cupos ocupados, para que haya tiempo de
 * promocionarla o de cancelarla con margen. Un aviso por clase para siempre
 * (dedup por classId): si sigue vacía al día siguiente, no se re-avisa.
 */

const DAYS_AHEAD = 4;
const OCCUPANCY_THRESHOLD = 0.4;

interface ClassRow {
  id: string;
  title: string;
  date: string;
  total_spots: number;
  spots_left: number | null;
  category_event: string;
  is_cancelled: boolean;
}

export interface LowOccupancyMetrics {
  checked: number;
  alertsSent: number;
  alertsSkipped: number;
  alertsFailed: number;
}

function formatDateLong(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export async function runLowOccupancyChecks(
  supabase: SupabaseClient,
  now: Date = new Date(),
  deps: NotifyDeps = {},
): Promise<LowOccupancyMetrics> {
  const metrics: LowOccupancyMetrics = {
    checked: 0,
    alertsSent: 0,
    alertsSkipped: 0,
    alertsFailed: 0,
  };

  const targetDate = buenosAiresDateInDays(DAYS_AHEAD, now);

  const { data, error } = await supabase
    .from("classes_with_availability")
    .select("id, title, date, total_spots, spots_left, category_event, is_cancelled")
    .eq("date", targetDate)
    .eq("is_cancelled", false)
    .in("category_event", ["adultos", "ninos"]);

  if (error) {
    throw new Error(`[low-occupancy-dispatch] fetch falló: ${error.message}`);
  }

  const rows = (data ?? []) as ClassRow[];
  metrics.checked = rows.length;

  for (const c of rows) {
    if (c.total_spots <= 0) continue;
    const spotsLeft = c.spots_left ?? c.total_spots;
    const occupancy = (c.total_spots - spotsLeft) / c.total_spots;
    if (occupancy >= OCCUPANCY_THRESHOLD) continue;

    try {
      const result = await notifyLowOccupancy(
        supabase,
        {
          classId: c.id,
          className: c.title,
          classDateLabel: formatDateLong(c.date),
          spotsLeft,
          totalSpots: c.total_spots,
          occupancyPct: Math.round(occupancy * 100),
          panelUrl: `${siteContact.siteUrl}/admin/clases/${c.id}`,
        },
        deps,
      );
      if (result.email.outcome === "sent") metrics.alertsSent += 1;
      else if (result.email.outcome === "not_claimed") metrics.alertsSkipped += 1;
      else metrics.alertsFailed += 1;
    } catch (err) {
      console.error(
        "[low-occupancy-dispatch] notifyLowOccupancy inesperado:",
        err instanceof Error ? err.message : String(err),
      );
      metrics.alertsFailed += 1;
    }
  }

  return metrics;
}
