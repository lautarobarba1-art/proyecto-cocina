import type { SupabaseClient } from "@supabase/supabase-js";

import { claimNotification, completeNotification } from "./claim.ts";
import { buildReservaConfirmadaKey, buildPagoConfirmadoKey } from "./idempotency.ts";
import type {
  ClaimNotificationResult,
  CompleteNotificationParams,
  NotificationEventType,
} from "./types.ts";
import {
  loadWhatsAppConfig,
  getTemplateConfig,
  type WhatsAppConfig,
} from "../whatsapp/config.ts";
import {
  sendWhatsAppTemplateMessage,
  type SendTemplateMessageParams,
  type SendTemplateMessageResult,
  type WhatsAppTemplateComponent,
} from "../whatsapp/client.ts";
import { classifyWhatsAppError } from "../whatsapp/errors.ts";
import {
  buildReservaConfirmadaComponents,
  buildPagoConfirmadoComponents,
} from "../whatsapp/templates.ts";
import { formatClassDateLong, formatClassTimeRange } from "../date/timezone.ts";
import type { EmailReservaConfirmacionData } from "../resend/template.ts";

/**
 * Capa fina de orquestación multi-canal para los eventos de negocio de la
 * Etapa 2. Cada canal (email/whatsapp) reclama su propia fila de
 * `notification_log` con su propia deduplication_key, envía (o se abstiene),
 * y completa el intento — de forma completamente independiente del otro
 * canal. Un fallo de un canal nunca afecta al otro, y ningún fallo de acá
 * revierte la reserva/pago que ya quedó persistido antes de llamar a esto.
 */

const EMAIL_TIMEOUT_MS = 5000;
const WHATSAPP_RETRY_BACKOFF_MS = 5 * 60 * 1000;

export type ChannelOutcome = "sent" | "failed" | "skipped" | "not_claimed" | "disabled";

export interface ChannelAttemptResult {
  outcome: ChannelOutcome;
  reason?: string;
}

export interface NotifyResult {
  email: ChannelAttemptResult;
  whatsapp: ChannelAttemptResult;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms),
    ),
  ]);
}

function errorMessageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * Formatter de fecha específico para el email, deliberadamente separado de
 * `formatClassDateLong` (lib/date/timezone.ts, usado para WhatsApp). Replica
 * a propósito el `formatDateLong` que ya vivía en
 * app/api/reservations/route.ts para no cambiar ni un carácter del contenido
 * del email existente al mover el envío acá adentro.
 */
function formatEmailDateLong(isoDate: string | null | undefined): string {
  if (!isoDate) return "—";
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function settledToResult(
  settled: PromiseSettledResult<ChannelAttemptResult>,
  channel: string,
): ChannelAttemptResult {
  if (settled.status === "fulfilled") return settled.value;
  console.error(`[notify] canal ${channel} rechazado inesperadamente:`, settled.reason);
  return { outcome: "failed", reason: "unexpected_exception" };
}

// ─── Dependencias inyectables (para tests; defaults = implementaciones reales) ──

type SendWhatsAppFn = (params: SendTemplateMessageParams) => Promise<SendTemplateMessageResult>;
type SendEmailReservaConfirmacionFn = (
  data: EmailReservaConfirmacionData,
) => Promise<{ success: boolean; error?: string }>;
type SendEmailReservaConfirmadaFn = (
  customerEmail: string,
  customerName: string,
  className: string,
) => Promise<{ success: boolean; error?: string }>;

export interface NotifyDeps {
  whatsappConfig?: WhatsAppConfig;
  sendWhatsApp?: SendWhatsAppFn;
  sendEmailReservaConfirmacion?: SendEmailReservaConfirmacionFn;
  sendEmailReservaConfirmada?: SendEmailReservaConfirmadaFn;
}

async function defaultSendEmailReservaConfirmacion(
  data: EmailReservaConfirmacionData,
): Promise<{ success: boolean; error?: string }> {
  const { sendEmailReservaConfirmacion } = await import("../resend/send.ts");
  return sendEmailReservaConfirmacion(data);
}

async function defaultSendEmailReservaConfirmada(
  customerEmail: string,
  customerName: string,
  className: string,
): Promise<{ success: boolean; error?: string }> {
  const { sendEmailReservaConfirmada } = await import("../resend/send.ts");
  return sendEmailReservaConfirmada(customerEmail, customerName, className);
}

// ─── Canal WhatsApp (genérico para ambos eventos) ──────────────────────────────

interface WhatsAppAttemptContext {
  reservationId: string;
  classId: string;
  /**
   * Ya normalizado a E.164 (o null). notify.ts NUNCA vuelve a normalizar
   * desde texto libre acá — eso ya se hizo una sola vez, en el servidor,
   * antes de persistir la reserva (ver create_reservation_atomic /
   * customer_phone_normalized). Esto garantiza que `recipient` en
   * notification_log y el `to` que recibe la Graph API sean siempre el
   * mismo valor normalizado, nunca el texto tal cual lo tipeó el cliente.
   */
  customerPhoneNormalized: string | null;
  whatsappConsent: boolean;
  /** Payload sanitizable a persistir en notification_log (sin teléfono: ya está en `recipient`). */
  templateVars: Record<string, unknown>;
  /** Puede lanzar si faltan variables o son inválidas — se traduce a un failed no reintentable. */
  buildComponents: () => WhatsAppTemplateComponent[];
}

async function attemptWhatsAppChannel(
  supabase: SupabaseClient,
  eventType: NotificationEventType,
  ctx: WhatsAppAttemptContext,
  config: WhatsAppConfig,
  sendWhatsApp: SendWhatsAppFn,
): Promise<ChannelAttemptResult> {
  // Canal deshabilitado: ni siquiera se reclama. No se crea ninguna fila de
  // notification_log, no se consume la deduplication_key de 'dry_run' — el
  // canal deshabilitado no debe poder bloquear ni un dry run ni un envío
  // 'live' futuro para el mismo evento (ver migración
  // 20260709000001_notification_log.sql, sección sobre delivery_mode).
  if (!config.enabled) {
    return { outcome: "disabled", reason: "disabled" };
  }

  const dedupKey =
    eventType === "reserva_confirmada"
      ? buildReservaConfirmadaKey(ctx.reservationId)
      : buildPagoConfirmadoKey(ctx.reservationId);

  // A esta altura config.enabled ya es true: solo falta distinguir dry_run
  // de live.
  const deliveryMode = config.dryRun ? "dry_run" : "live";

  const recipient = ctx.customerPhoneNormalized ?? "missing";
  const templateConfig = getTemplateConfig(config, eventType);

  let claim: ClaimNotificationResult;
  try {
    claim = await claimNotification(supabase, {
      channel: "whatsapp",
      deduplicationKey: dedupKey,
      eventType,
      recipient,
      reservationId: ctx.reservationId,
      classId: ctx.classId,
      templateName: templateConfig.name,
      payload: ctx.templateVars,
      deliveryMode,
    });
  } catch (err) {
    console.error(`[notify/whatsapp:${eventType}] claim falló:`, errorMessageOf(err));
    return { outcome: "failed", reason: "claim_error" };
  }

  if (!claim.claimed) {
    return { outcome: "not_claimed" };
  }
  const claimToken = claim.claimToken as string;

  const finish = async (params: Omit<CompleteNotificationParams, "id" | "claimToken">) => {
    try {
      await completeNotification(supabase, { id: claim.id, claimToken, ...params });
    } catch (err) {
      console.error(`[notify/whatsapp:${eventType}] complete falló:`, errorMessageOf(err));
    }
  };

  // Gating: consentimiento ausente o teléfono inválido/ausente NO son fallas
  // técnicas — se completan como 'skipped' sin marcar retryable, nunca se
  // reintentan. Se resuelven DESPUÉS del claim (no antes) a propósito: así
  // queda un registro auditable de "se intentó, se omitió por X motivo",
  // igual que dry_run/disabled más abajo.
  if (!ctx.whatsappConsent) {
    await finish({ status: "skipped", errorCode: "consent_missing" });
    return { outcome: "skipped", reason: "consent_missing" };
  }
  if (!ctx.customerPhoneNormalized) {
    await finish({ status: "skipped", errorCode: "invalid_or_missing_phone" });
    return { outcome: "skipped", reason: "invalid_or_missing_phone" };
  }
  if (!templateConfig.name) {
    await finish({ status: "skipped", errorCode: "template_not_configured" });
    return { outcome: "skipped", reason: "template_not_configured" };
  }

  let components: WhatsAppTemplateComponent[];
  try {
    components = ctx.buildComponents();
  } catch (err) {
    await finish({
      status: "failed",
      retryable: false,
      errorCode: "invalid_template_vars",
      errorMessage: errorMessageOf(err),
    });
    return { outcome: "failed", reason: "invalid_template_vars" };
  }

  const sendResult = await sendWhatsApp({
    to: ctx.customerPhoneNormalized,
    templateName: templateConfig.name,
    languageCode: templateConfig.language,
    components,
  });

  switch (sendResult.outcome) {
    case "disabled":
      await finish({ status: "skipped", errorCode: "disabled" });
      return { outcome: "skipped", reason: "disabled" };
    case "dry_run":
      await finish({ status: "skipped", errorCode: "dry_run" });
      return { outcome: "skipped", reason: "dry_run" };
    case "sent":
      await finish({ status: "sent", providerMessageId: sendResult.providerMessageId });
      return { outcome: "sent" };
    case "error": {
      const { retryable } = classifyWhatsAppError(sendResult.errorCode);
      await finish({
        status: "failed",
        retryable,
        nextRetryAt: retryable
          ? new Date(Date.now() + WHATSAPP_RETRY_BACKOFF_MS).toISOString()
          : null,
        errorCode: sendResult.errorCode ?? "unknown_error",
        errorMessage: sendResult.errorMessage,
      });
      return { outcome: "failed", reason: sendResult.errorCode };
    }
    default: {
      const exhaustive: never = sendResult.outcome;
      throw new Error(`[notify/whatsapp] outcome de envío desconocido: ${String(exhaustive)}`);
    }
  }
}

// ─── Canal email: confirmación de reserva ──────────────────────────────────────

interface EmailReservaConfirmadaContext {
  reservationId: string;
  classId: string;
  customerName: string;
  customerEmail: string;
  className: string;
  classDateISO: string;
  classStartTime: string;
  classEndTime: string;
  spots: number;
  depositAmount: number | null;
  transferHolder: string | null;
  transferAlias: string | null;
  transferCvu: string | null;
  transferBank: string | null;
}

async function attemptEmailReservaConfirmada(
  supabase: SupabaseClient,
  ctx: EmailReservaConfirmadaContext,
  sendEmail: SendEmailReservaConfirmacionFn,
): Promise<ChannelAttemptResult> {
  const dedupKey = buildReservaConfirmadaKey(ctx.reservationId);

  let claim: ClaimNotificationResult;
  try {
    claim = await claimNotification(supabase, {
      channel: "email",
      deduplicationKey: dedupKey,
      eventType: "reserva_confirmada",
      recipient: ctx.customerEmail,
      reservationId: ctx.reservationId,
      classId: ctx.classId,
      templateName: "reserva_confirmacion",
      payload: {
        customerName: ctx.customerName,
        className: ctx.className,
        classDate: ctx.classDateISO,
        spots: ctx.spots,
      },
      deliveryMode: "live",
    });
  } catch (err) {
    console.error("[notify/email:reserva_confirmada] claim falló:", errorMessageOf(err));
    return { outcome: "failed", reason: "claim_error" };
  }

  if (!claim.claimed) return { outcome: "not_claimed" };
  const claimToken = claim.claimToken as string;

  try {
    const result = await withTimeout(
      sendEmail({
        customerName: ctx.customerName,
        customerEmail: ctx.customerEmail,
        className: ctx.className,
        classDate: formatEmailDateLong(ctx.classDateISO),
        classTime: `${(ctx.classStartTime ?? "").slice(0, 5)} - ${(ctx.classEndTime ?? "").slice(0, 5)}`,
        depositAmount: ctx.depositAmount,
        cupos: ctx.spots,
        transferHolder: ctx.transferHolder,
        transferAlias: ctx.transferAlias,
        transferCvu: ctx.transferCvu,
        transferBank: ctx.transferBank,
      }),
      EMAIL_TIMEOUT_MS,
    );

    if (result.success) {
      await completeNotification(supabase, { id: claim.id, claimToken, status: "sent" });
      return { outcome: "sent" };
    }
    await completeNotification(supabase, {
      id: claim.id,
      claimToken,
      status: "failed",
      retryable: true,
      errorCode: "resend_error",
      errorMessage: result.error ?? null,
    });
    return { outcome: "failed", reason: "resend_error" };
  } catch (err) {
    try {
      await completeNotification(supabase, {
        id: claim.id,
        claimToken,
        status: "failed",
        retryable: true,
        errorCode: "exception",
        errorMessage: errorMessageOf(err),
      });
    } catch (completeErr) {
      console.error("[notify/email:reserva_confirmada] complete falló:", errorMessageOf(completeErr));
    }
    return { outcome: "failed", reason: "exception" };
  }
}

// ─── Canal email: confirmación de pago ─────────────────────────────────────────

interface EmailPagoConfirmadoContext {
  reservationId: string;
  classId: string;
  customerName: string;
  customerEmail: string;
  className: string;
}

async function attemptEmailPagoConfirmado(
  supabase: SupabaseClient,
  ctx: EmailPagoConfirmadoContext,
  sendEmail: SendEmailReservaConfirmadaFn,
): Promise<ChannelAttemptResult> {
  const dedupKey = buildPagoConfirmadoKey(ctx.reservationId);

  let claim: ClaimNotificationResult;
  try {
    claim = await claimNotification(supabase, {
      channel: "email",
      deduplicationKey: dedupKey,
      eventType: "pago_confirmado",
      recipient: ctx.customerEmail,
      reservationId: ctx.reservationId,
      classId: ctx.classId,
      templateName: "reserva_confirmada",
      payload: { customerName: ctx.customerName, className: ctx.className },
      deliveryMode: "live",
    });
  } catch (err) {
    console.error("[notify/email:pago_confirmado] claim falló:", errorMessageOf(err));
    return { outcome: "failed", reason: "claim_error" };
  }

  if (!claim.claimed) return { outcome: "not_claimed" };
  const claimToken = claim.claimToken as string;

  try {
    const result = await withTimeout(
      sendEmail(ctx.customerEmail, ctx.customerName, ctx.className),
      EMAIL_TIMEOUT_MS,
    );

    if (result.success) {
      await completeNotification(supabase, { id: claim.id, claimToken, status: "sent" });
      return { outcome: "sent" };
    }
    await completeNotification(supabase, {
      id: claim.id,
      claimToken,
      status: "failed",
      retryable: true,
      errorCode: "resend_error",
      errorMessage: result.error ?? null,
    });
    return { outcome: "failed", reason: "resend_error" };
  } catch (err) {
    try {
      await completeNotification(supabase, {
        id: claim.id,
        claimToken,
        status: "failed",
        retryable: true,
        errorCode: "exception",
        errorMessage: errorMessageOf(err),
      });
    } catch (completeErr) {
      console.error("[notify/email:pago_confirmado] complete falló:", errorMessageOf(completeErr));
    }
    return { outcome: "failed", reason: "exception" };
  }
}

// ─── API pública ────────────────────────────────────────────────────────────────

export interface NotifyReservationConfirmedParams {
  reservationId: string;
  classId: string;
  customerName: string;
  customerEmail: string;
  customerPhoneNormalized: string | null;
  whatsappConsent: boolean;
  className: string;
  classDateISO: string;
  classStartTime: string;
  classEndTime: string;
  spots: number;
  depositAmount: number | null;
  transferHolder: string | null;
  transferAlias: string | null;
  transferCvu: string | null;
  transferBank: string | null;
}

export async function notifyReservationConfirmed(
  supabase: SupabaseClient,
  params: NotifyReservationConfirmedParams,
  deps: NotifyDeps = {},
): Promise<NotifyResult> {
  const whatsappConfig = deps.whatsappConfig ?? loadWhatsAppConfig();
  const sendWhatsApp: SendWhatsAppFn =
    deps.sendWhatsApp ?? ((p) => sendWhatsAppTemplateMessage(p, { config: whatsappConfig }));
  const sendEmail = deps.sendEmailReservaConfirmacion ?? defaultSendEmailReservaConfirmacion;

  const classDate = formatClassDateLong(params.classDateISO);
  const classTime = formatClassTimeRange(params.classStartTime, params.classEndTime);

  const [emailSettled, whatsappSettled] = await Promise.allSettled([
    attemptEmailReservaConfirmada(
      supabase,
      {
        reservationId: params.reservationId,
        classId: params.classId,
        customerName: params.customerName,
        customerEmail: params.customerEmail,
        className: params.className,
        classDateISO: params.classDateISO,
        classStartTime: params.classStartTime,
        classEndTime: params.classEndTime,
        spots: params.spots,
        depositAmount: params.depositAmount,
        transferHolder: params.transferHolder,
        transferAlias: params.transferAlias,
        transferCvu: params.transferCvu,
        transferBank: params.transferBank,
      },
      sendEmail,
    ),
    attemptWhatsAppChannel(
      supabase,
      "reserva_confirmada",
      {
        reservationId: params.reservationId,
        classId: params.classId,
        customerPhoneNormalized: params.customerPhoneNormalized,
        whatsappConsent: params.whatsappConsent,
        templateVars: {
          customerName: params.customerName,
          className: params.className,
          classDate,
          classTime,
          spots: params.spots,
        },
        buildComponents: () =>
          buildReservaConfirmadaComponents({
            customerName: params.customerName,
            className: params.className,
            classDate,
            classTime,
            spots: params.spots,
          }),
      },
      whatsappConfig,
      sendWhatsApp,
    ),
  ]);

  return {
    email: settledToResult(emailSettled, "email"),
    whatsapp: settledToResult(whatsappSettled, "whatsapp"),
  };
}

export interface NotifyPaymentConfirmedParams {
  reservationId: string;
  classId: string;
  customerName: string;
  customerEmail: string;
  customerPhoneNormalized: string | null;
  whatsappConsent: boolean;
  className: string;
  classDateISO: string;
  classStartTime: string;
  classEndTime: string;
}

export async function notifyPaymentConfirmed(
  supabase: SupabaseClient,
  params: NotifyPaymentConfirmedParams,
  deps: NotifyDeps = {},
): Promise<NotifyResult> {
  const whatsappConfig = deps.whatsappConfig ?? loadWhatsAppConfig();
  const sendWhatsApp: SendWhatsAppFn =
    deps.sendWhatsApp ?? ((p) => sendWhatsAppTemplateMessage(p, { config: whatsappConfig }));
  const sendEmail = deps.sendEmailReservaConfirmada ?? defaultSendEmailReservaConfirmada;

  const classDate = formatClassDateLong(params.classDateISO);
  const classTime = formatClassTimeRange(params.classStartTime, params.classEndTime);

  const [emailSettled, whatsappSettled] = await Promise.allSettled([
    attemptEmailPagoConfirmado(
      supabase,
      {
        reservationId: params.reservationId,
        classId: params.classId,
        customerName: params.customerName,
        customerEmail: params.customerEmail,
        className: params.className,
      },
      sendEmail,
    ),
    attemptWhatsAppChannel(
      supabase,
      "pago_confirmado",
      {
        reservationId: params.reservationId,
        classId: params.classId,
        customerPhoneNormalized: params.customerPhoneNormalized,
        whatsappConsent: params.whatsappConsent,
        templateVars: {
          customerName: params.customerName,
          className: params.className,
          classDate,
          classTime,
        },
        buildComponents: () =>
          buildPagoConfirmadoComponents({
            customerName: params.customerName,
            className: params.className,
            classDate,
            classTime,
          }),
      },
      whatsappConfig,
      sendWhatsApp,
    ),
  ]);

  return {
    email: settledToResult(emailSettled, "email"),
    whatsapp: settledToResult(whatsappSettled, "whatsapp"),
  };
}
