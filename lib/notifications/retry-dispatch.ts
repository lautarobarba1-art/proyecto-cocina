import type { SupabaseClient } from "@supabase/supabase-js";

import { claimNotification, completeNotification } from "./claim.ts";
import {
  notifyReservationConfirmed,
  notifyPaymentConfirmed,
  notifyComprobanteUploaded,
  notifyAdminNewReservation,
  notifyAdminNewInquiry,
  notifyComprobanteReminder,
  notifyReservationExpired,
  notifyReservationCancelled,
  notifyClassReminder,
  notifyClassRescheduled,
  type NotifyDeps,
  type NotifyResult,
} from "./notify.ts";
import type { NotificationEventType } from "./types.ts";
import { siteContact } from "../site/contact.ts";

/**
 * Worker de reintentos de `notification_log`. La infraestructura de reintento
 * (columnas `retryable` / `next_retry_at` / `attempt_count`, y el re-claim
 * dentro de `claim_notification_attempt`) ya existía, pero nada la usaba: los
 * eventos "one-shot" (`reserva_confirmada`, `pago_confirmado`,
 * `comprobante_subido`, `reprogramacion`, los avisos al admin, y ahora las
 * cancelaciones manuales) quedaban `failed` para siempre si Resend fallaba una
 * vez.
 *
 * Estrategia: por cada fila fallida y vencida, reconstruir los params desde la
 * DB (reserva + clase, o inquiry) y volver a llamar a la MISMA función
 * `notify*`. Esa función recomputa la misma dedup key, `claim_notification_attempt`
 * re-reclama la fila fallida (no crea una nueva), y se reintenta el envío. El
 * backoff entre intentos lo pone `finishFailedAttempt` en notify.ts.
 */

const RETRY_BATCH_LIMIT = 50;

export interface NotificationRetryMetrics {
  checked: number;
  retried: number;
  skipped: number;
  stillFailing: number;
  permanentlyRetired: number;
  unsupported: number;
}

interface FailedRow {
  id: string;
  event_type: NotificationEventType;
  template_name: string | null;
  deduplication_key: string;
  recipient: string;
  reservation_id: string | null;
  class_id: string | null;
  attempt_count: number;
  max_attempts: number;
  payload: Record<string, unknown>;
}

interface ReservationRow {
  id: string;
  class_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  spots: number;
  classes: {
    title: string;
    date: string;
    start_time: string | null;
    end_time: string | null;
    deposit_amount: number | string | null;
  } | null;
}

interface InquiryRow {
  id: string;
  customer_name: string;
  customer_email: string;
  type: "contact" | "espacio" | "eventos";
  payload: Record<string, unknown> | null;
}

function toNumberOrNull(value: number | string | null | undefined): number | null {
  if (value == null) return null;
  return typeof value === "string" ? parseFloat(value) : value;
}

function inquiryTypeLabel(type: InquiryRow["type"]): string {
  if (type === "espacio") return "Alquiler del espacio";
  if (type === "eventos") return "Evento privado";
  return "Contacto";
}

function transferEnv() {
  return {
    transferHolder: process.env.TRANSFER_ACCOUNT_HOLDER ?? null,
    transferAlias: process.env.TRANSFER_ALIAS ?? null,
    transferCvu: process.env.TRANSFER_CVU ?? null,
    transferBank: process.env.TRANSFER_BANK_NAME ?? null,
  };
}

/** El id de la inquiry va embebido en la dedup key: `consulta_nueva_admin:<uuid>`. */
function inquiryIdFromKey(key: string): string | null {
  const parts = key.split(":");
  return parts.length === 2 && parts[1] ? parts[1] : null;
}

/**
 * Marca una fila como falla permanente (no reintentable) cuando la fuente ya
 * no existe (reserva borrada, inquiry borrada) o el payload no alcanza para
 * reconstruir el evento. Necesita reclamar la fila primero para tener el
 * claim_token.
 */
async function retirePermanently(
  supabase: SupabaseClient,
  row: FailedRow,
  errorCode: string,
): Promise<boolean> {
  try {
    const claim = await claimNotification(supabase, {
      channel: "email",
      deduplicationKey: row.deduplication_key,
      eventType: row.event_type,
      recipient: row.recipient,
      reservationId: row.reservation_id,
      classId: row.class_id,
      templateName: row.template_name,
      payload: row.payload,
      deliveryMode: "live",
    });
    if (!claim.claimed || !claim.claimToken) return false;
    await completeNotification(supabase, {
      id: claim.id,
      claimToken: claim.claimToken,
      status: "failed",
      retryable: false,
      errorCode,
      errorMessage: "el reintento automático no pudo reconstruir el evento",
    });
    return true;
  } catch {
    return false;
  }
}

async function fetchReservation(
  supabase: SupabaseClient,
  reservationId: string,
): Promise<ReservationRow | null> {
  const { data } = await supabase
    .from("reservations")
    .select(
      `
      id,
      class_id,
      customer_name,
      customer_email,
      customer_phone,
      spots,
      classes ( title, date, start_time, end_time, deposit_amount )
    `,
    )
    .eq("id", reservationId)
    .maybeSingle();
  return (data as unknown as ReservationRow | null) ?? null;
}

/**
 * Re-despacha una fila fallida. Devuelve el `NotifyResult` si se pudo
 * reintentar, o `null` si no se soporta / no se pudo reconstruir (el llamador
 * decide si retirar la fila).
 */
async function redispatch(
  supabase: SupabaseClient,
  row: FailedRow,
  deps: NotifyDeps,
): Promise<NotifyResult | null> {
  const ev = row.event_type;

  if (ev === "consulta_nueva_admin") {
    const inquiryId = inquiryIdFromKey(row.deduplication_key);
    if (!inquiryId) return null;
    const { data } = await supabase
      .from("inquiries")
      .select("id, customer_name, customer_email, type, payload")
      .eq("id", inquiryId)
      .maybeSingle();
    const inq = (data as unknown as InquiryRow | null) ?? null;
    if (!inq) return null;
    return notifyAdminNewInquiry(
      supabase,
      {
        inquiryId: inq.id,
        customerName: inq.customer_name,
        customerEmail: inq.customer_email,
        typeLabel: inquiryTypeLabel(inq.type),
        message:
          typeof inq.payload?.mensaje === "string" ? inq.payload.mensaje : null,
        reviewUrl: `${siteContact.siteUrl}/admin/inquiries`,
      },
      deps,
    );
  }

  // Todos los demás eventos están atados a una reserva.
  if (!row.reservation_id) return null;
  const r = await fetchReservation(supabase, row.reservation_id);
  if (!r) return null;

  const cls = r.classes;
  const className = cls?.title ?? "(clase)";
  const classDateISO = cls?.date ?? "";
  const classStartTime = cls?.start_time ?? "";
  const classEndTime = cls?.end_time ?? "";
  const depositPerSpot = toNumberOrNull(cls?.deposit_amount ?? null);

  switch (ev) {
    case "reserva_confirmada":
      return notifyReservationConfirmed(
        supabase,
        {
          reservationId: r.id,
          classId: r.class_id,
          customerName: r.customer_name,
          customerEmail: r.customer_email,
          className,
          classDateISO,
          classStartTime,
          classEndTime,
          spots: r.spots,
          depositAmount:
            depositPerSpot != null ? depositPerSpot * r.spots : null,
          ...transferEnv(),
        },
        deps,
      );

    case "pago_confirmado":
      return notifyPaymentConfirmed(
        supabase,
        {
          reservationId: r.id,
          classId: r.class_id,
          customerName: r.customer_name,
          customerEmail: r.customer_email,
          className,
          classDateISO,
          classStartTime,
          classEndTime,
          spots: r.spots,
        },
        deps,
      );

    case "comprobante_subido":
      return notifyComprobanteUploaded(
        supabase,
        {
          reservationId: r.id,
          classId: r.class_id,
          customerName: r.customer_name,
          customerEmail: r.customer_email,
          className,
          spots: r.spots,
          reviewUrl: `${siteContact.siteUrl}/admin/reservas?estado=pending`,
        },
        deps,
      );

    case "reserva_nueva_admin":
      return notifyAdminNewReservation(
        supabase,
        {
          reservationId: r.id,
          classId: r.class_id,
          customerName: r.customer_name,
          customerEmail: r.customer_email,
          customerPhone: r.customer_phone,
          className,
          classDateISO,
          spots: r.spots,
          reviewUrl: `${siteContact.siteUrl}/admin/reservas?estado=pending`,
        },
        deps,
      );

    case "recordatorio":
      return notifyClassReminder(
        supabase,
        {
          reservationId: r.id,
          classId: r.class_id,
          customerName: r.customer_name,
          customerEmail: r.customer_email,
          className,
          classDateISO,
          classStartTime,
          classEndTime,
          spots: r.spots,
        },
        deps,
      );

    case "recordatorio_comprobante":
      return notifyComprobanteReminder(
        supabase,
        {
          reservationId: r.id,
          classId: r.class_id,
          customerName: r.customer_name,
          customerEmail: r.customer_email,
          className,
          depositAmount: depositPerSpot,
          ...transferEnv(),
        },
        deps,
      );

    case "cancelacion":
      if (row.template_name === "reserva_cancelada_falta_comprobante") {
        return notifyReservationExpired(
          supabase,
          {
            reservationId: r.id,
            classId: r.class_id,
            customerName: r.customer_name,
            customerEmail: r.customer_email,
            className,
          },
          deps,
        );
      }
      return notifyReservationCancelled(
        supabase,
        {
          reservationId: r.id,
          classId: r.class_id,
          customerName: r.customer_name,
          customerEmail: r.customer_email,
          className,
        },
        deps,
      );

    case "reprogramacion": {
      const p = row.payload;
      const need = [
        "oldDate",
        "oldStartTime",
        "oldEndTime",
        "newDate",
        "newStartTime",
        "newEndTime",
      ] as const;
      if (need.some((k) => typeof p[k] !== "string")) return null; // payload viejo, sin horarios
      return notifyClassRescheduled(
        supabase,
        {
          reservationId: r.id,
          classId: r.class_id,
          customerName: r.customer_name,
          customerEmail: r.customer_email,
          className,
          oldDateISO: p.oldDate as string,
          oldStartTime: p.oldStartTime as string,
          oldEndTime: p.oldEndTime as string,
          newDateISO: p.newDate as string,
          newStartTime: p.newStartTime as string,
          newEndTime: p.newEndTime as string,
        },
        deps,
      );
    }

    default:
      return null;
  }
}

export async function runNotificationRetries(
  supabase: SupabaseClient,
  deps: NotifyDeps = {},
  now: Date = new Date(),
): Promise<NotificationRetryMetrics> {
  const metrics: NotificationRetryMetrics = {
    checked: 0,
    retried: 0,
    skipped: 0,
    stillFailing: 0,
    permanentlyRetired: 0,
    unsupported: 0,
  };

  const { data, error } = await supabase
    .from("notification_log")
    .select(
      `
      id,
      event_type,
      template_name,
      deduplication_key,
      recipient,
      reservation_id,
      class_id,
      attempt_count,
      max_attempts,
      payload
    `,
    )
    .eq("status", "failed")
    .eq("retryable", true)
    .lte("next_retry_at", now.toISOString())
    .order("next_retry_at", { ascending: true })
    .limit(RETRY_BATCH_LIMIT);

  if (error) {
    throw new Error(`[retry-dispatch] fetch de fallidas falló: ${error.message}`);
  }

  const rows = ((data ?? []) as unknown as FailedRow[]).filter(
    (r) => r.attempt_count < r.max_attempts,
  );
  metrics.checked = rows.length;

  for (const row of rows) {
    let result: NotifyResult | null;
    try {
      result = await redispatch(supabase, row, deps);
    } catch (err) {
      console.error(
        `[retry-dispatch] redispatch inesperado (${row.event_type}):`,
        err instanceof Error ? err.message : String(err),
      );
      metrics.stillFailing += 1;
      continue;
    }

    if (result === null) {
      // No se pudo reconstruir el evento (fuente borrada, payload incompleto,
      // o evento no soportado por el worker) — retirar para no reintentarlo
      // eternamente.
      const retired = await retirePermanently(
        supabase,
        row,
        "retry_unreconstructable",
      );
      if (retired) metrics.permanentlyRetired += 1;
      else metrics.unsupported += 1;
      continue;
    }

    if (result.email.outcome === "sent") metrics.retried += 1;
    else if (result.email.outcome === "not_claimed") metrics.skipped += 1;
    else metrics.stillFailing += 1;
  }

  return metrics;
}
