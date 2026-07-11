import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ClaimNotificationParams,
  ClaimNotificationResult,
  CompleteNotificationParams,
  CompleteNotificationResult,
} from "./types.ts";
import { sanitizeNotificationPayload } from "./payload.ts";

const DEFAULT_STALE_AFTER_MINUTES = 10;
const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_DELIVERY_MODE = "live";

/**
 * Reclama atómicamente el derecho a enviar una notificación. Debe llamarse
 * ANTES de invocar WhatsApp/Resend — nunca después. Si `claimed` es false,
 * el llamador no debe enviar nada (ya hay otro intento en curso, ya se
 * resolvió antes, el error fue clasificado como permanente, o se agotaron
 * los reintentos).
 *
 * Envuelve la RPC `claim_notification_attempt` (ver migración
 * 20260709000001_notification_log.sql), que hace el insert-o-reclamo de
 * forma atómica en una sola sentencia SQL y emite un `claim_token` (lease)
 * nuevo en cada reclamo exitoso.
 */
export async function claimNotification(
  supabase: SupabaseClient,
  params: ClaimNotificationParams,
): Promise<ClaimNotificationResult> {
  const { data, error } = await supabase.rpc("claim_notification_attempt", {
    p_channel: params.channel,
    p_deduplication_key: params.deduplicationKey,
    p_event_type: params.eventType,
    p_recipient: params.recipient,
    p_reservation_id: params.reservationId ?? null,
    p_class_id: params.classId ?? null,
    p_template_name: params.templateName ?? null,
    p_payload: sanitizeNotificationPayload(params.payload),
    p_delivery_mode: params.deliveryMode ?? DEFAULT_DELIVERY_MODE,
    p_max_attempts: params.maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
    p_stale_after_minutes: params.staleAfterMinutes ?? DEFAULT_STALE_AFTER_MINUTES,
  });

  if (error) {
    throw new Error(`[notifications/claim] claim_notification_attempt falló: ${error.message}`);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    throw new Error(
      "[notifications/claim] claim_notification_attempt no devolvió ninguna fila",
    );
  }

  return {
    id: row.id,
    claimToken: row.claim_token,
    attemptCount: row.attempt_count,
    claimed: row.claimed,
  };
}

/**
 * Persiste el resultado de un intento ya reclamado. Exige el `claimToken`
 * devuelto por `claimNotification`: si para cuando se llama esta función otro
 * proceso ya reclamó la fila de nuevo (lease vencido y recuperado), el token
 * quedó obsoleto y esta llamada no actualiza nada — `updated` vuelve false.
 * El llamador DEBE chequear `updated` y, si es false, no reportar éxito (el
 * resultado real ya lo escribió, o lo va a escribir, el proceso que sí tiene
 * el lease vigente).
 */
export async function completeNotification(
  supabase: SupabaseClient,
  params: CompleteNotificationParams,
): Promise<CompleteNotificationResult> {
  const { data, error } = await supabase.rpc("complete_notification_attempt", {
    p_id: params.id,
    p_claim_token: params.claimToken,
    p_status: params.status,
    p_provider_message_id: params.providerMessageId ?? null,
    p_error_code: params.errorCode ?? null,
    p_error_message: params.errorMessage ?? null,
    p_retryable: params.retryable ?? null,
    p_next_retry_at: params.nextRetryAt ?? null,
  });

  if (error) {
    throw new Error(
      `[notifications/claim] complete_notification_attempt falló: ${error.message}`,
    );
  }

  return { updated: Boolean(data) };
}
