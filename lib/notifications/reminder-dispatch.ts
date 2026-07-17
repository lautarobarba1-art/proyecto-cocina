import type { SupabaseClient } from "@supabase/supabase-js";

import { notifyClassReminder } from "./notify.ts";
import type { NotifyDeps } from "./notify.ts";
import { isWithinReminderWindow } from "../date/reminder-window.ts";

export interface ReminderDispatchMetrics {
  classesChecked: number;
  reservationsFound: number;
  sent: number;
  /**
   * No reclamado: ya se había enviado antes, agotó reintentos, o lo tomó
   * otra corrida concurrente. No se distingue el motivo a propósito — hacerlo
   * exigiría una lectura extra por reserva ya procesada, que es el caso más
   * frecuente en cada corrida (misma reserva vista en ~2 corridas seguidas).
   */
  skipped: number;
  failed: number;
}

interface CandidateRow {
  id: string;
  class_id: string;
  customer_name: string;
  customer_email: string;
  spots: number;
  classes: {
    title: string;
    date: string;
    start_time: string;
    end_time: string;
    is_cancelled: boolean;
  } | null;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Busca reservas `confirmed` cuya clase arranca dentro de la ventana de
 * recordatorio (ver REMINDER_WINDOW_*_HOURS en reminder-window.ts) y dispara
 * `notifyClassReminder` para cada una.
 *
 * Pensado para correr detrás de un disparador externo (cron) cada hora. Es
 * seguro invocarlo más de una vez para la misma reserva y más de una vez por
 * hora: `notifyClassReminder` deduplica vía `notification_log`, así que esta
 * función no necesita (ni debe) tener su propia lógica anti-duplicados.
 */
export async function runClassReminders(
  supabase: SupabaseClient,
  now: Date = new Date(),
  deps: NotifyDeps = {},
): Promise<ReminderDispatchMetrics> {
  const metrics: ReminderDispatchMetrics = {
    classesChecked: 0,
    reservationsFound: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
  };

  // Cota amplia a propósito: NO es la ventana real de 23-25h (esa la aplica
  // isWithinReminderWindow más abajo, con la aritmética de zona horaria
  // correcta). Esta cota solo evita escanear todo el historial de clases a
  // medida que la tabla crece con los años.
  const lowerBoundDate = new Date(now.getTime() - 2 * ONE_DAY_MS)
    .toISOString()
    .slice(0, 10);
  const upperBoundDate = new Date(now.getTime() + 3 * ONE_DAY_MS)
    .toISOString()
    .slice(0, 10);

  const { data, error } = await supabase
    .from("reservations")
    .select(
      `
      id,
      class_id,
      customer_name,
      customer_email,
      spots,
      classes (
        title,
        date,
        start_time,
        end_time,
        is_cancelled
      )
    `,
    )
    .eq("status", "confirmed")
    .gte("classes.date", lowerBoundDate)
    .lte("classes.date", upperBoundDate);

  if (error) {
    throw new Error(`[reminder-dispatch] fetch de candidatas falló: ${error.message}`);
  }

  const rows = (data ?? []) as unknown as CandidateRow[];

  // Filtro defensivo en JS (mismo patrón que getReservasForAdmin): el filtro
  // por columna de una FK embebida no siempre se aplica de forma confiable
  // a nivel SQL en todas las versiones de PostgREST.
  const candidatas = rows.filter((r) => {
    const cls = r.classes;
    if (!cls) return false;
    if (cls.is_cancelled) return false;
    return cls.date >= lowerBoundDate && cls.date <= upperBoundDate;
  });

  metrics.classesChecked = new Set(candidatas.map((r) => r.class_id)).size;

  for (const row of candidatas) {
    const cls = row.classes;
    if (!cls) continue;
    if (!isWithinReminderWindow(cls.date, cls.start_time, now)) continue;

    metrics.reservationsFound += 1;

    try {
      const result = await notifyClassReminder(
        supabase,
        {
          reservationId: row.id,
          classId: row.class_id,
          customerName: row.customer_name,
          customerEmail: row.customer_email,
          className: cls.title,
          classDateISO: cls.date,
          classStartTime: cls.start_time,
          classEndTime: cls.end_time,
          spots: row.spots,
        },
        deps,
      );

      if (result.email.outcome === "sent") metrics.sent += 1;
      else if (result.email.outcome === "not_claimed") metrics.skipped += 1;
      else metrics.failed += 1;
    } catch (err) {
      console.error("[reminder-dispatch] notifyClassReminder inesperado:", err);
      metrics.failed += 1;
    }
  }

  return metrics;
}
