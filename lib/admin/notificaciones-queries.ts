import { getSupabaseAdmin } from "@/lib/supabase/server";

export type NotificationEventType =
  | "reserva_confirmada"
  | "pago_confirmado"
  | "recordatorio"
  | "cancelacion"
  | "reprogramacion";

export type NotificationStatus =
  | "processing"
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "skipped";

export interface NotificationLogAdmin {
  id: string;
  eventType: NotificationEventType;
  status: NotificationStatus;
  recipient: string;
  templateName: string | null;
  attemptCount: number;
  maxAttempts: number;
  retryable: boolean | null;
  nextRetryAt: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  reservationId: string | null;
  classId: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface NotificationLogFilter {
  eventType?: NotificationEventType | "all";
  status?: NotificationStatus | "all";
}

/**
 * Trae el historial de notification_log para observabilidad admin
 * (no incluye payload/claim_token — no hace falta para esta vista de
 * solo lectura, y evita exponer más de lo necesario).
 */
export async function getNotificationLogForAdmin(
  limit: number = 200,
  filter: NotificationLogFilter = {},
): Promise<NotificationLogAdmin[]> {
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from("notification_log")
    .select(
      `
      id,
      event_type,
      status,
      recipient,
      template_name,
      attempt_count,
      max_attempts,
      retryable,
      next_retry_at,
      error_code,
      error_message,
      reservation_id,
      class_id,
      created_at,
      completed_at
    `,
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filter.eventType && filter.eventType !== "all") {
    query = query.eq("event_type", filter.eventType);
  }
  if (filter.status && filter.status !== "all") {
    query = query.eq("status", filter.status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[getNotificationLogForAdmin]", error);
    throw new Error(`Failed to fetch notification_log: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    eventType: row.event_type,
    status: row.status,
    recipient: row.recipient,
    templateName: row.template_name,
    attemptCount: row.attempt_count,
    maxAttempts: row.max_attempts,
    retryable: row.retryable,
    nextRetryAt: row.next_retry_at,
    errorCode: row.error_code,
    errorMessage: row.error_message,
    reservationId: row.reservation_id,
    classId: row.class_id,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  }));
}
