import type { SupabaseClient } from "@supabase/supabase-js";

import { notifyComprobanteReminder, notifyReservationExpired } from "./notify.ts";
import type { NotifyDeps } from "./notify.ts";

export interface PaymentDeadlineMetrics {
  candidatesChecked: number;
  remindersSent: number;
  remindersSkipped: number;
  remindersFailed: number;
  expired: number;
  expirationEmailsFailed: number;
}

interface CandidateRow {
  id: string;
  class_id: string;
  customer_name: string;
  customer_email: string;
  created_at: string;
  classes: {
    title: string;
    deposit_amount: number | string | null;
  } | null;
}

const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * Ventana angosta a propósito, mismo criterio que REMINDER_WINDOW_*_HOURS en
 * lib/date/reminder-window.ts: con un disparador que corre cada hora, cada
 * reserva cae en esta ventana en ~2 corridas antes de salir de ella — eso
 * evita reenviar el aviso cada hora hasta la cancelación.
 */
const REMINDER_WINDOW_MIN_HOURS = 23;
const REMINDER_WINDOW_MAX_HOURS = 25;

/**
 * A diferencia del recordatorio, no hace falta ventana acá: una vez pasadas
 * las 48hs la condición queda verdadera para siempre hasta que se cancele, y
 * cancelar es idempotente (`.eq("status", "pending")` en el UPDATE) — no hay
 * riesgo de "cancelar dos veces" aunque el cron la vea vencida en varias
 * corridas seguidas.
 */
const EXPIRATION_HOURS = 48;

function hoursSince(isoTimestamp: string, now: Date): number {
  return (now.getTime() - new Date(isoTimestamp).getTime()) / ONE_HOUR_MS;
}

function toNumberOrNull(value: number | string | null): number | null {
  if (value == null) return null;
  return typeof value === "string" ? parseFloat(value) : value;
}

/**
 * Busca reservas `pending` sin comprobante subido y, según cuánto hace que
 * se crearon:
 *   - entre 23 y 25hs: avisa al cliente que mañana se cancela si no sube el
 *     comprobante (notifyComprobanteReminder).
 *   - 48hs o más: cancela la reserva (libera el cupo) y avisa al cliente
 *     (notifyReservationExpired).
 *
 * Deliberadamente NO toca reservas con `comprobante_url` seteado, aunque
 * sigan `pending`: esas están esperando revisión de la admin, no faltando
 * comprobante — cancelarlas de todos modos castigaría a quien ya pagó. Ver
 * plan de auditoría del 2026-07-30 (bug 1e).
 */
export async function runPaymentDeadlineChecks(
  supabase: SupabaseClient,
  now: Date = new Date(),
  deps: NotifyDeps = {},
): Promise<PaymentDeadlineMetrics> {
  const metrics: PaymentDeadlineMetrics = {
    candidatesChecked: 0,
    remindersSent: 0,
    remindersSkipped: 0,
    remindersFailed: 0,
    expired: 0,
    expirationEmailsFailed: 0,
  };

  const { data, error } = await supabase
    .from("reservations")
    .select(
      `
      id,
      class_id,
      customer_name,
      customer_email,
      created_at,
      classes (
        title,
        deposit_amount
      )
    `,
    )
    .eq("status", "pending")
    .is("comprobante_url", null);

  if (error) {
    throw new Error(`[payment-deadline-dispatch] fetch de candidatas falló: ${error.message}`);
  }

  const rows = (data ?? []) as unknown as CandidateRow[];
  metrics.candidatesChecked = rows.length;

  const transferHolder = process.env.TRANSFER_ACCOUNT_HOLDER ?? null;
  const transferAlias = process.env.TRANSFER_ALIAS ?? null;
  const transferCvu = process.env.TRANSFER_CVU ?? null;
  const transferBank = process.env.TRANSFER_BANK_NAME ?? null;

  for (const row of rows) {
    const cls = row.classes;
    const className = cls?.title ?? "(clase)";
    const age = hoursSince(row.created_at, now);

    if (age >= EXPIRATION_HOURS) {
      const { data: cancelled, error: cancelError } = await supabase
        .from("reservations")
        .update({ status: "cancelled", cancelled_at: now.toISOString() })
        .eq("id", row.id)
        .eq("status", "pending")
        .select("id")
        .maybeSingle();

      if (cancelError) {
        console.error("[payment-deadline-dispatch] cancel falló:", cancelError.message);
        continue;
      }
      if (!cancelled) continue; // ya la había resuelto otra corrida (aprobada, cancelada, etc.)

      metrics.expired += 1;

      try {
        const result = await notifyReservationExpired(
          supabase,
          {
            reservationId: row.id,
            classId: row.class_id,
            customerName: row.customer_name,
            customerEmail: row.customer_email,
            className,
          },
          deps,
        );
        if (result.email.outcome === "failed") metrics.expirationEmailsFailed += 1;
      } catch (err) {
        console.error("[payment-deadline-dispatch] notifyReservationExpired inesperado:", err);
        metrics.expirationEmailsFailed += 1;
      }
      continue;
    }

    if (age >= REMINDER_WINDOW_MIN_HOURS && age < REMINDER_WINDOW_MAX_HOURS) {
      try {
        const result = await notifyComprobanteReminder(
          supabase,
          {
            reservationId: row.id,
            classId: row.class_id,
            customerName: row.customer_name,
            customerEmail: row.customer_email,
            className,
            depositAmount: toNumberOrNull(cls?.deposit_amount ?? null),
            transferHolder,
            transferAlias,
            transferCvu,
            transferBank,
          },
          deps,
        );
        if (result.email.outcome === "sent") metrics.remindersSent += 1;
        else if (result.email.outcome === "not_claimed") metrics.remindersSkipped += 1;
        else metrics.remindersFailed += 1;
      } catch (err) {
        console.error("[payment-deadline-dispatch] notifyComprobanteReminder inesperado:", err);
        metrics.remindersFailed += 1;
      }
    }
  }

  return metrics;
}
