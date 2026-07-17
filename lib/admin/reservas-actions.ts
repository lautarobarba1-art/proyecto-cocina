import type { SupabaseClient } from "@supabase/supabase-js";

import { notifyPaymentConfirmed, type NotifyResult } from "../notifications/notify.ts";

/**
 * Confirma el pago de una reserva y dispara la notificación correspondiente.
 * Extraído de app/api/admin/reservations/[id]/route.ts para poder probar la
 * garantía de transición real (pending -> confirmed) sin tener que montar
 * un Request/Response de Next.js completo.
 *
 * La garantía "solo notifica ante una transición persistida" vive enteramente
 * en el `.eq("status", "pending")` del UPDATE: si la fila no estaba en
 * 'pending' (ya confirmada, cancelada, o no existe), el UPDATE no matchea
 * ninguna fila, `data` sale null, y NUNCA se llega a llamar
 * `notifyPaymentConfirmed`. Repetir la acción (doble click, POST repetido)
 * cae siempre en esta segunda rama después del primer éxito.
 */

export type ConfirmPaymentResult =
  | { ok: true; status: string; notifyResult: NotifyResult }
  | { ok: false; reason: "not_pending_or_not_found" }
  | { ok: false; reason: "db_error" };

export interface ConfirmReservationPaymentDeps {
  /** Inyectable para tests — default: la implementación real. */
  notifyPaymentConfirmed?: typeof notifyPaymentConfirmed;
}

export async function confirmReservationPayment(
  supabase: SupabaseClient,
  reservationId: string,
  deps: ConfirmReservationPaymentDeps = {},
): Promise<ConfirmPaymentResult> {
  const notify = deps.notifyPaymentConfirmed ?? notifyPaymentConfirmed;
  const { data, error } = await supabase
    .from("reservations")
    .update({
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
    })
    .eq("id", reservationId)
    .eq("status", "pending")
    .select("id, status, customer_name, customer_email, class_id")
    .maybeSingle();

  if (error) {
    console.error("[confirmReservationPayment]", error);
    return { ok: false, reason: "db_error" };
  }
  if (!data) {
    return { ok: false, reason: "not_pending_or_not_found" };
  }

  const { data: cls } = await supabase
    .from("classes")
    .select("title, date, start_time, end_time")
    .eq("id", data.class_id)
    .maybeSingle();

  let notifyResult: NotifyResult;
  try {
    notifyResult = await notify(supabase, {
      reservationId: data.id,
      classId: data.class_id,
      customerName: data.customer_name,
      customerEmail: data.customer_email,
      className: cls?.title ?? "(clase)",
      classDateISO: cls?.date ?? "",
      classStartTime: cls?.start_time ?? "",
      classEndTime: cls?.end_time ?? "",
    });
  } catch (err) {
    console.error("[confirmReservationPayment] notifyPaymentConfirmed error:", err);
    notifyResult = {
      email: { outcome: "failed", reason: "unexpected_exception" },
    };
  }

  return { ok: true, status: data.status, notifyResult };
}
