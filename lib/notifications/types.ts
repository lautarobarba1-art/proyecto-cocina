export type NotificationChannel = "whatsapp" | "email";

/**
 * 'live' = intento real (feature habilitada, no simulado). 'dry_run' =
 * cualquier ejecución que no vaya a pegarle de verdad al proveedor
 * (WHATSAPP_ENABLED=false o WHATSAPP_DRY_RUN=true). Forma parte de la clave
 * única junto con channel+deduplicationKey a propósito: así un intento
 * simulado nunca bloquea el envío real futuro del mismo evento (ver
 * comentario en la migración 20260709000001_notification_log.sql).
 */
export type NotificationDeliveryMode = "live" | "dry_run";

export type NotificationEventType =
  | "reserva_confirmada"
  | "pago_confirmado"
  | "recordatorio"
  | "cancelacion"
  | "reprogramacion";

/**
 * 'skipped' cubre tanto "feature deshabilitada" como "dry run": un envío
 * simulado nunca debe quedar registrado como 'sent'. 'delivered'/'read' se
 * escriben desde el webhook de estado de entrega (fuera de esta etapa), no
 * desde `completeNotification`.
 */
export type NotificationStatus =
  | "processing"
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "skipped";

/** Estados que `completeNotification` puede escribir (ver complete_notification_attempt). */
export type CompletableNotificationStatus = "sent" | "failed" | "skipped";

export interface NotificationLogRow {
  id: string;
  channel: NotificationChannel;
  deliveryMode: NotificationDeliveryMode;
  eventType: NotificationEventType;
  deduplicationKey: string;
  reservationId: string | null;
  classId: string | null;
  recipient: string;
  templateName: string | null;
  payload: Record<string, unknown>;
  status: NotificationStatus;
  providerMessageId: string | null;
  claimToken: string | null;
  attemptCount: number;
  maxAttempts: number;
  retryable: boolean | null;
  nextRetryAt: string | null;
  processingStartedAt: string;
  lastAttemptAt: string;
  completedAt: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClaimNotificationParams {
  channel: NotificationChannel;
  deduplicationKey: string;
  eventType: NotificationEventType;
  recipient: string;
  reservationId?: string | null;
  classId?: string | null;
  /** Nombre de la plantilla usada (WhatsApp) o null/omitido para email. */
  templateName?: string | null;
  /**
   * Variables mínimas para reproducir la notificación. Se sanitiza con
   * `sanitizeNotificationPayload` antes de persistir — nunca debe llegar acá
   * un token, header, secreto, ni la respuesta completa del proveedor.
   */
  payload?: Record<string, unknown>;
  /**
   * 'live' solo cuando se está por intentar un envío real. Default 'live'
   * por conveniencia de los tests/llamadas directas, pero cualquier caller
   * que dispare esto desde el cliente de WhatsApp DEBE pasar 'dry_run'
   * explícito si WHATSAPP_ENABLED=false o WHATSAPP_DRY_RUN=true.
   */
  deliveryMode?: NotificationDeliveryMode;
  /** Máximo de intentos antes de que una falla recuperable deje de ser reclamable. */
  maxAttempts?: number;
  /** Después de cuántos minutos en 'processing' se considera huérfana y se puede reclamar de nuevo. */
  staleAfterMinutes?: number;
}

export interface ClaimNotificationResult {
  id: string;
  /** Lease de este intento. null si claimed=false (no se ganó el reclamo). */
  claimToken: string | null;
  attemptCount: number;
  /** Si es false, ya hay otro intento en curso, ya está resuelta, o el error es permanente/agotó reintentos: no enviar nada. */
  claimed: boolean;
}

export interface CompleteNotificationParams {
  id: string;
  /** El claim_token devuelto por claimNotification. Si no coincide con el vigente, la actualización no tiene efecto. */
  claimToken: string;
  status: CompletableNotificationStatus;
  providerMessageId?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  /** Obligatorio cuando status='failed': true = reintentable, false = permanente. */
  retryable?: boolean | null;
  /**
   * Cuándo puede reclamarse de nuevo si retryable=true. Si se omite, el
   * servidor la completa con now() (reintentable de inmediato) — nunca queda
   * null en la fila cuando retryable=true (invariante de la tabla). Se
   * ignora (se fuerza a null) cuando retryable=false.
   */
  nextRetryAt?: string | null;
}

export interface CompleteNotificationResult {
  /** false si se perdió el lease (otro proceso ya reclamó la fila de nuevo, o ya estaba resuelta): no reportar éxito. */
  updated: boolean;
}
