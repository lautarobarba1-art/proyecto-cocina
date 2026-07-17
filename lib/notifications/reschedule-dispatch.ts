import type { SupabaseClient } from "@supabase/supabase-js";

import { notifyClassRescheduled } from "./notify.ts";
import type { NotifyDeps } from "./notify.ts";

export interface RescheduleDetails {
  oldDateISO: string;
  oldStartTime: string;
  oldEndTime: string;
  newDateISO: string;
  newStartTime: string;
  newEndTime: string;
}

export interface RescheduleDispatchResult {
  notified: number;
  skipped: number;
  failed: number;
}

export interface ScheduleSnapshot {
  date: string; // YYYY-MM-DD
  startTime: string; // acepta "HH:MM" o "HH:MM:SS"
  endTime: string;
}

/**
 * Compara fecha/horario tolerando que un lado venga en formato "HH:MM" (forms)
 * y el otro en "HH:MM:SS" (columna `time` de Postgres) — comparar los strings
 * crudos sin normalizar detectaría un "cambio" falso en cada edición aunque el
 * horario real no haya cambiado.
 */
export function hasScheduleChanged(before: ScheduleSnapshot, after: ScheduleSnapshot): boolean {
  return (
    before.date !== after.date ||
    before.startTime.slice(0, 5) !== after.startTime.slice(0, 5) ||
    before.endTime.slice(0, 5) !== after.endTime.slice(0, 5)
  );
}

/**
 * Avisa por email a todas las reservas activas (pending + confirmed) de una
 * clase que cambió de fecha/horario. Se llama DESPUÉS de que el UPDATE de
 * la clase ya se persistió — un fallo de email acá nunca debe revertir ni
 * bloquear la edición de la clase (ver caller en app/api/admin/classes/[id]).
 *
 * A diferencia del flujo de cancelación (que llama a Resend directo), esto
 * sigue el mismo patrón de claim/complete que pago confirmado y recordatorio:
 * deduplicado por notification_log, reintentable, auditable.
 *
 * Los envíos van en paralelo (Promise.allSettled, mismo patrón que
 * app/api/admin/classes/[id]/cancel/route.ts) — el PATCH que llama a esta
 * función espera a que termine antes de responder, así que una clase con
 * muchas reservas activas no puede ir sumando ~5s (EMAIL_TIMEOUT_MS) por
 * cada una en serie hasta superar el timeout de la función serverless.
 */
export async function notifyReservationsOfReschedule(
  supabase: SupabaseClient,
  classId: string,
  className: string,
  details: RescheduleDetails,
  deps: NotifyDeps = {},
): Promise<RescheduleDispatchResult> {
  const result: RescheduleDispatchResult = { notified: 0, skipped: 0, failed: 0 };

  const { data, error } = await supabase
    .from("reservations")
    .select("id, customer_name, customer_email")
    .eq("class_id", classId)
    .in("status", ["pending", "confirmed"]);

  if (error) {
    console.error("[reschedule-dispatch] fetch de reservas falló:", error.message);
    return result;
  }

  const outcomes = await Promise.allSettled(
    (data ?? []).map((row) =>
      notifyClassRescheduled(
        supabase,
        {
          reservationId: row.id,
          classId,
          customerName: row.customer_name,
          customerEmail: row.customer_email,
          className,
          ...details,
        },
        deps,
      ),
    ),
  );

  for (const outcome of outcomes) {
    if (outcome.status === "rejected") {
      console.error("[reschedule-dispatch] notifyClassRescheduled inesperado:", outcome.reason);
      result.failed += 1;
      continue;
    }

    const { email } = outcome.value;
    if (email.outcome === "sent") result.notified += 1;
    else if (email.outcome === "not_claimed") result.skipped += 1;
    else result.failed += 1;
  }

  return result;
}
