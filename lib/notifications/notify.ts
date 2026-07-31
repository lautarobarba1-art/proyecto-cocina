import type { SupabaseClient } from "@supabase/supabase-js";

import { claimNotification, completeNotification } from "./claim.ts";
import {
  buildPagoConfirmadoKey,
  buildReservaConfirmadaKey,
  buildRecordatorioKey,
  buildReprogramacionKey,
  buildComprobanteSubidoKey,
  buildCancelacionKey,
  buildRecordatorioComprobanteKey,
} from "./idempotency.ts";
import type { ClaimNotificationResult } from "./types.ts";
import type {
  EmailReservaConfirmacionData,
  EmailPagoConfirmadoData,
  EmailRecordatorioData,
  EmailRecordatorioComprobanteData,
  EmailReprogramacionData,
  EmailAdminComprobanteSubidoData,
} from "../resend/template.ts";
import { siteContact } from "../site/contact.ts";

function comprobanteUploadUrl(reservationId: string): string {
  return `${siteContact.siteUrl}/reservas/${reservationId}/comprobante`;
}

const EMAIL_TIMEOUT_MS = 5000;

export type ChannelOutcome = "sent" | "failed" | "not_claimed";

export interface ChannelAttemptResult {
  outcome: ChannelOutcome;
  reason?: string;
}

export interface NotifyResult {
  email: ChannelAttemptResult;
}

type SendEmailReservaConfirmacionFn = (
  data: EmailReservaConfirmacionData,
) => Promise<{ success: boolean; error?: string }>;

type SendEmailReservaConfirmadaFn = (
  data: EmailPagoConfirmadoData,
) => Promise<{ success: boolean; error?: string }>;

type SendEmailRecordatorioFn = (
  data: EmailRecordatorioData,
) => Promise<{ success: boolean; error?: string }>;

type SendEmailReprogramacionFn = (
  data: EmailReprogramacionData,
) => Promise<{ success: boolean; error?: string }>;

type SendEmailAdminComprobanteSubidoFn = (
  data: EmailAdminComprobanteSubidoData,
) => Promise<{ success: boolean; error?: string }>;

type SendEmailRecordatorioComprobanteFn = (
  data: EmailRecordatorioComprobanteData,
) => Promise<{ success: boolean; error?: string }>;

type SendEmailReservaCanceladaPorFaltaComprobanteFn = (
  customerEmail: string,
  customerName: string,
  className: string,
) => Promise<{ success: boolean; error?: string }>;

export interface NotifyDeps {
  sendEmailReservaConfirmacion?: SendEmailReservaConfirmacionFn;
  sendEmailReservaConfirmada?: SendEmailReservaConfirmadaFn;
  sendEmailRecordatorio?: SendEmailRecordatorioFn;
  sendEmailReprogramacion?: SendEmailReprogramacionFn;
  sendEmailAdminComprobanteSubido?: SendEmailAdminComprobanteSubidoFn;
  sendEmailRecordatorioComprobante?: SendEmailRecordatorioComprobanteFn;
  sendEmailReservaCanceladaPorFaltaComprobante?: SendEmailReservaCanceladaPorFaltaComprobanteFn;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms),
    ),
  ]);
}

function errorMessageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function formatEmailDateLong(isoDate: string | null | undefined): string {
  if (!isoDate) return "—";
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

async function defaultSendEmailReservaConfirmacion(
  data: EmailReservaConfirmacionData,
): Promise<{ success: boolean; error?: string }> {
  const { sendEmailReservaConfirmacion } = await import("../resend/send.ts");
  return sendEmailReservaConfirmacion(data);
}

async function defaultSendEmailReservaConfirmada(
  data: EmailPagoConfirmadoData,
): Promise<{ success: boolean; error?: string }> {
  const { sendEmailReservaConfirmada } = await import("../resend/send.ts");
  return sendEmailReservaConfirmada(data);
}

async function defaultSendEmailRecordatorio(
  data: EmailRecordatorioData,
): Promise<{ success: boolean; error?: string }> {
  const { sendEmailRecordatorio } = await import("../resend/send.ts");
  return sendEmailRecordatorio(data);
}

async function defaultSendEmailReprogramacion(
  data: EmailReprogramacionData,
): Promise<{ success: boolean; error?: string }> {
  const { sendEmailReprogramacion } = await import("../resend/send.ts");
  return sendEmailReprogramacion(data);
}

async function defaultSendEmailAdminComprobanteSubido(
  data: EmailAdminComprobanteSubidoData,
): Promise<{ success: boolean; error?: string }> {
  const { sendEmailAdminComprobanteSubido } = await import("../resend/send.ts");
  return sendEmailAdminComprobanteSubido(data);
}

async function defaultSendEmailRecordatorioComprobante(
  data: EmailRecordatorioComprobanteData,
): Promise<{ success: boolean; error?: string }> {
  const { sendEmailRecordatorioComprobante } = await import("../resend/send.ts");
  return sendEmailRecordatorioComprobante(data);
}

async function defaultSendEmailReservaCanceladaPorFaltaComprobante(
  customerEmail: string,
  customerName: string,
  className: string,
): Promise<{ success: boolean; error?: string }> {
  const { sendEmailReservaCanceladaPorFaltaComprobante } = await import("../resend/send.ts");
  return sendEmailReservaCanceladaPorFaltaComprobante(customerEmail, customerName, className);
}

async function finishFailedAttempt(
  supabase: SupabaseClient,
  claim: ClaimNotificationResult,
  errorCode: string,
  errorMessage: string | null,
): Promise<void> {
  if (!claim.claimToken) return;
  try {
    await completeNotification(supabase, {
      id: claim.id,
      claimToken: claim.claimToken,
      status: "failed",
      retryable: true,
      errorCode,
      errorMessage,
    });
  } catch (error) {
    console.error("[notify/email] complete falló:", errorMessageOf(error));
  }
}

export interface NotifyReservationConfirmedParams {
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

export async function notifyReservationConfirmed(
  supabase: SupabaseClient,
  params: NotifyReservationConfirmedParams,
  deps: NotifyDeps = {},
): Promise<NotifyResult> {
  const sendEmail = deps.sendEmailReservaConfirmacion ?? defaultSendEmailReservaConfirmacion;
  let claim: ClaimNotificationResult;

  try {
    claim = await claimNotification(supabase, {
      channel: "email",
      deduplicationKey: buildReservaConfirmadaKey(params.reservationId),
      eventType: "reserva_confirmada",
      recipient: params.customerEmail,
      reservationId: params.reservationId,
      classId: params.classId,
      templateName: "reserva_confirmacion",
      payload: {
        customerName: params.customerName,
        className: params.className,
        classDate: params.classDateISO,
        spots: params.spots,
      },
      deliveryMode: "live",
    });
  } catch (error) {
    console.error("[notify/email:reserva_confirmada] claim falló:", errorMessageOf(error));
    return { email: { outcome: "failed", reason: "claim_error" } };
  }

  if (!claim.claimed || !claim.claimToken) {
    return { email: { outcome: "not_claimed" } };
  }

  try {
    const result = await withTimeout(
      sendEmail({
        customerName: params.customerName,
        customerEmail: params.customerEmail,
        className: params.className,
        classDate: formatEmailDateLong(params.classDateISO),
        classTime: `${params.classStartTime.slice(0, 5)} - ${params.classEndTime.slice(0, 5)}`,
        depositAmount: params.depositAmount,
        cupos: params.spots,
        transferHolder: params.transferHolder,
        transferAlias: params.transferAlias,
        transferCvu: params.transferCvu,
        transferBank: params.transferBank,
        uploadUrl: comprobanteUploadUrl(params.reservationId),
      }),
      EMAIL_TIMEOUT_MS,
    );

    if (!result.success) {
      await finishFailedAttempt(supabase, claim, "resend_error", result.error ?? null);
      return { email: { outcome: "failed", reason: "resend_error" } };
    }

    await completeNotification(supabase, {
      id: claim.id,
      claimToken: claim.claimToken,
      status: "sent",
    });
    return { email: { outcome: "sent" } };
  } catch (error) {
    await finishFailedAttempt(supabase, claim, "exception", errorMessageOf(error));
    return { email: { outcome: "failed", reason: "exception" } };
  }
}

export interface NotifyPaymentConfirmedParams {
  reservationId: string;
  classId: string;
  customerName: string;
  customerEmail: string;
  className: string;
  classDateISO: string;
  classStartTime: string;
  classEndTime: string;
  spots: number;
}

export async function notifyPaymentConfirmed(
  supabase: SupabaseClient,
  params: NotifyPaymentConfirmedParams,
  deps: NotifyDeps = {},
): Promise<NotifyResult> {
  const sendEmail = deps.sendEmailReservaConfirmada ?? defaultSendEmailReservaConfirmada;
  let claim: ClaimNotificationResult;

  try {
    claim = await claimNotification(supabase, {
      channel: "email",
      deduplicationKey: buildPagoConfirmadoKey(params.reservationId),
      eventType: "pago_confirmado",
      recipient: params.customerEmail,
      reservationId: params.reservationId,
      classId: params.classId,
      templateName: "reserva_confirmada",
      payload: {
        customerName: params.customerName,
        className: params.className,
        classDate: params.classDateISO,
        spots: params.spots,
      },
      deliveryMode: "live",
    });
  } catch (error) {
    console.error("[notify/email:pago_confirmado] claim falló:", errorMessageOf(error));
    return { email: { outcome: "failed", reason: "claim_error" } };
  }

  if (!claim.claimed || !claim.claimToken) {
    return { email: { outcome: "not_claimed" } };
  }

  try {
    const result = await withTimeout(
      sendEmail({
        customerName: params.customerName,
        customerEmail: params.customerEmail,
        className: params.className,
        classDate: formatEmailDateLong(params.classDateISO),
        classTime: `${params.classStartTime.slice(0, 5)} - ${params.classEndTime.slice(0, 5)}`,
        cupos: params.spots,
      }),
      EMAIL_TIMEOUT_MS,
    );
    if (!result.success) {
      await finishFailedAttempt(supabase, claim, "resend_error", result.error ?? null);
      return { email: { outcome: "failed", reason: "resend_error" } };
    }

    await completeNotification(supabase, {
      id: claim.id,
      claimToken: claim.claimToken,
      status: "sent",
    });
    return { email: { outcome: "sent" } };
  } catch (error) {
    await finishFailedAttempt(supabase, claim, "exception", errorMessageOf(error));
    return { email: { outcome: "failed", reason: "exception" } };
  }
}

export interface NotifyComprobanteUploadedParams {
  reservationId: string;
  classId: string;
  customerName: string;
  customerEmail: string;
  className: string;
  spots: number;
  reviewUrl: string;
}

/**
 * Avisa a la admin por email que llegó un comprobante para revisar. Sin
 * ADMIN_EMAIL configurado, no hace nada (no bloquea la subida, que ya se
 * persistió antes de llamar a esta función).
 */
export async function notifyComprobanteUploaded(
  supabase: SupabaseClient,
  params: NotifyComprobanteUploadedParams,
  deps: NotifyDeps = {},
): Promise<NotifyResult> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn("[notify/email:comprobante_subido] Falta ADMIN_EMAIL — no se avisa");
    return { email: { outcome: "not_claimed" } };
  }

  const sendEmail = deps.sendEmailAdminComprobanteSubido ?? defaultSendEmailAdminComprobanteSubido;
  let claim: ClaimNotificationResult;

  try {
    claim = await claimNotification(supabase, {
      channel: "email",
      deduplicationKey: buildComprobanteSubidoKey(params.reservationId),
      eventType: "comprobante_subido",
      recipient: adminEmail,
      reservationId: params.reservationId,
      classId: params.classId,
      templateName: "admin_comprobante_subido",
      payload: {
        customerName: params.customerName,
        className: params.className,
        spots: params.spots,
      },
      deliveryMode: "live",
    });
  } catch (error) {
    console.error("[notify/email:comprobante_subido] claim falló:", errorMessageOf(error));
    return { email: { outcome: "failed", reason: "claim_error" } };
  }

  if (!claim.claimed || !claim.claimToken) {
    return { email: { outcome: "not_claimed" } };
  }

  try {
    const result = await withTimeout(
      sendEmail({
        customerName: params.customerName,
        customerEmail: params.customerEmail,
        className: params.className,
        cupos: params.spots,
        reviewUrl: params.reviewUrl,
      }),
      EMAIL_TIMEOUT_MS,
    );
    if (!result.success) {
      await finishFailedAttempt(supabase, claim, "resend_error", result.error ?? null);
      return { email: { outcome: "failed", reason: "resend_error" } };
    }

    await completeNotification(supabase, {
      id: claim.id,
      claimToken: claim.claimToken,
      status: "sent",
    });
    return { email: { outcome: "sent" } };
  } catch (error) {
    await finishFailedAttempt(supabase, claim, "exception", errorMessageOf(error));
    return { email: { outcome: "failed", reason: "exception" } };
  }
}

export interface NotifyComprobanteReminderParams {
  reservationId: string;
  classId: string;
  customerName: string;
  customerEmail: string;
  className: string;
  depositAmount: number | null;
  transferHolder: string | null;
  transferAlias: string | null;
  transferCvu: string | null;
  transferBank: string | null;
}

/**
 * Aviso al cliente ~24hs después de reservar si la reserva sigue `pending`
 * sin comprobante subido: "mañana se cancela si no subís el comprobante".
 */
export async function notifyComprobanteReminder(
  supabase: SupabaseClient,
  params: NotifyComprobanteReminderParams,
  deps: NotifyDeps = {},
): Promise<NotifyResult> {
  const sendEmail = deps.sendEmailRecordatorioComprobante ?? defaultSendEmailRecordatorioComprobante;
  let claim: ClaimNotificationResult;

  try {
    claim = await claimNotification(supabase, {
      channel: "email",
      deduplicationKey: buildRecordatorioComprobanteKey(params.reservationId),
      eventType: "recordatorio_comprobante",
      recipient: params.customerEmail,
      reservationId: params.reservationId,
      classId: params.classId,
      templateName: "recordatorio_comprobante",
      payload: {
        customerName: params.customerName,
        className: params.className,
      },
      deliveryMode: "live",
    });
  } catch (error) {
    console.error("[notify/email:recordatorio_comprobante] claim falló:", errorMessageOf(error));
    return { email: { outcome: "failed", reason: "claim_error" } };
  }

  if (!claim.claimed || !claim.claimToken) {
    return { email: { outcome: "not_claimed" } };
  }

  try {
    const result = await withTimeout(
      sendEmail({
        customerName: params.customerName,
        customerEmail: params.customerEmail,
        className: params.className,
        depositAmount: params.depositAmount,
        transferHolder: params.transferHolder,
        transferAlias: params.transferAlias,
        transferCvu: params.transferCvu,
        transferBank: params.transferBank,
        uploadUrl: comprobanteUploadUrl(params.reservationId),
      }),
      EMAIL_TIMEOUT_MS,
    );
    if (!result.success) {
      await finishFailedAttempt(supabase, claim, "resend_error", result.error ?? null);
      return { email: { outcome: "failed", reason: "resend_error" } };
    }

    await completeNotification(supabase, {
      id: claim.id,
      claimToken: claim.claimToken,
      status: "sent",
    });
    return { email: { outcome: "sent" } };
  } catch (error) {
    await finishFailedAttempt(supabase, claim, "exception", errorMessageOf(error));
    return { email: { outcome: "failed", reason: "exception" } };
  }
}

export interface NotifyReservationExpiredParams {
  reservationId: string;
  classId: string;
  customerName: string;
  customerEmail: string;
  className: string;
}

/**
 * Avisa al cliente que su reserva se canceló automáticamente por no haber
 * llegado comprobante dentro del plazo. Reusa el evento 'cancelacion' (misma
 * clave de dedup que una cancelación manual del admin): semánticamente sigue
 * siendo una cancelación, solo cambia el disparador y el copy del email.
 */
export async function notifyReservationExpired(
  supabase: SupabaseClient,
  params: NotifyReservationExpiredParams,
  deps: NotifyDeps = {},
): Promise<NotifyResult> {
  const sendEmail =
    deps.sendEmailReservaCanceladaPorFaltaComprobante ??
    defaultSendEmailReservaCanceladaPorFaltaComprobante;
  let claim: ClaimNotificationResult;

  try {
    claim = await claimNotification(supabase, {
      channel: "email",
      deduplicationKey: buildCancelacionKey(params.reservationId),
      eventType: "cancelacion",
      recipient: params.customerEmail,
      reservationId: params.reservationId,
      classId: params.classId,
      templateName: "reserva_cancelada_falta_comprobante",
      payload: {
        customerName: params.customerName,
        className: params.className,
      },
      deliveryMode: "live",
    });
  } catch (error) {
    console.error("[notify/email:cancelacion(expirada)] claim falló:", errorMessageOf(error));
    return { email: { outcome: "failed", reason: "claim_error" } };
  }

  if (!claim.claimed || !claim.claimToken) {
    return { email: { outcome: "not_claimed" } };
  }

  try {
    const result = await withTimeout(
      sendEmail(params.customerEmail, params.customerName, params.className),
      EMAIL_TIMEOUT_MS,
    );
    if (!result.success) {
      await finishFailedAttempt(supabase, claim, "resend_error", result.error ?? null);
      return { email: { outcome: "failed", reason: "resend_error" } };
    }

    await completeNotification(supabase, {
      id: claim.id,
      claimToken: claim.claimToken,
      status: "sent",
    });
    return { email: { outcome: "sent" } };
  } catch (error) {
    await finishFailedAttempt(supabase, claim, "exception", errorMessageOf(error));
    return { email: { outcome: "failed", reason: "exception" } };
  }
}

export interface NotifyClassReminderParams {
  reservationId: string;
  classId: string;
  customerName: string;
  customerEmail: string;
  className: string;
  classDateISO: string;
  classStartTime: string;
  classEndTime: string;
  spots: number;
}

export async function notifyClassReminder(
  supabase: SupabaseClient,
  params: NotifyClassReminderParams,
  deps: NotifyDeps = {},
): Promise<NotifyResult> {
  const sendEmail = deps.sendEmailRecordatorio ?? defaultSendEmailRecordatorio;
  let claim: ClaimNotificationResult;

  try {
    claim = await claimNotification(supabase, {
      channel: "email",
      deduplicationKey: buildRecordatorioKey(
        params.reservationId,
        params.classDateISO,
        params.classStartTime,
      ),
      eventType: "recordatorio",
      recipient: params.customerEmail,
      reservationId: params.reservationId,
      classId: params.classId,
      templateName: "recordatorio",
      payload: {
        customerName: params.customerName,
        className: params.className,
        classDate: params.classDateISO,
        spots: params.spots,
      },
      deliveryMode: "live",
    });
  } catch (error) {
    console.error("[notify/email:recordatorio] claim falló:", errorMessageOf(error));
    return { email: { outcome: "failed", reason: "claim_error" } };
  }

  if (!claim.claimed || !claim.claimToken) {
    return { email: { outcome: "not_claimed" } };
  }

  try {
    const result = await withTimeout(
      sendEmail({
        customerName: params.customerName,
        customerEmail: params.customerEmail,
        className: params.className,
        classDate: formatEmailDateLong(params.classDateISO),
        classTime: `${params.classStartTime.slice(0, 5)} - ${params.classEndTime.slice(0, 5)}`,
        cupos: params.spots,
      }),
      EMAIL_TIMEOUT_MS,
    );
    if (!result.success) {
      await finishFailedAttempt(supabase, claim, "resend_error", result.error ?? null);
      return { email: { outcome: "failed", reason: "resend_error" } };
    }

    await completeNotification(supabase, {
      id: claim.id,
      claimToken: claim.claimToken,
      status: "sent",
    });
    return { email: { outcome: "sent" } };
  } catch (error) {
    await finishFailedAttempt(supabase, claim, "exception", errorMessageOf(error));
    return { email: { outcome: "failed", reason: "exception" } };
  }
}

export interface NotifyClassRescheduledParams {
  reservationId: string;
  classId: string;
  customerName: string;
  customerEmail: string;
  className: string;
  oldDateISO: string;
  oldStartTime: string;
  oldEndTime: string;
  newDateISO: string;
  newStartTime: string;
  newEndTime: string;
}

export async function notifyClassRescheduled(
  supabase: SupabaseClient,
  params: NotifyClassRescheduledParams,
  deps: NotifyDeps = {},
): Promise<NotifyResult> {
  const sendEmail = deps.sendEmailReprogramacion ?? defaultSendEmailReprogramacion;
  let claim: ClaimNotificationResult;

  try {
    claim = await claimNotification(supabase, {
      channel: "email",
      deduplicationKey: buildReprogramacionKey({
        reservationId: params.reservationId,
        oldDate: params.oldDateISO,
        oldStartTime: params.oldStartTime,
        oldEndTime: params.oldEndTime,
        newDate: params.newDateISO,
        newStartTime: params.newStartTime,
        newEndTime: params.newEndTime,
      }),
      eventType: "reprogramacion",
      recipient: params.customerEmail,
      reservationId: params.reservationId,
      classId: params.classId,
      templateName: "reprogramacion",
      payload: {
        customerName: params.customerName,
        className: params.className,
        oldDate: params.oldDateISO,
        newDate: params.newDateISO,
      },
      deliveryMode: "live",
    });
  } catch (error) {
    console.error("[notify/email:reprogramacion] claim falló:", errorMessageOf(error));
    return { email: { outcome: "failed", reason: "claim_error" } };
  }

  if (!claim.claimed || !claim.claimToken) {
    return { email: { outcome: "not_claimed" } };
  }

  try {
    const result = await withTimeout(
      sendEmail({
        customerName: params.customerName,
        customerEmail: params.customerEmail,
        className: params.className,
        oldDate: formatEmailDateLong(params.oldDateISO),
        oldTime: `${params.oldStartTime.slice(0, 5)} - ${params.oldEndTime.slice(0, 5)}`,
        newDate: formatEmailDateLong(params.newDateISO),
        newTime: `${params.newStartTime.slice(0, 5)} - ${params.newEndTime.slice(0, 5)}`,
      }),
      EMAIL_TIMEOUT_MS,
    );
    if (!result.success) {
      await finishFailedAttempt(supabase, claim, "resend_error", result.error ?? null);
      return { email: { outcome: "failed", reason: "resend_error" } };
    }

    await completeNotification(supabase, {
      id: claim.id,
      claimToken: claim.claimToken,
      status: "sent",
    });
    return { email: { outcome: "sent" } };
  } catch (error) {
    await finishFailedAttempt(supabase, claim, "exception", errorMessageOf(error));
    return { email: { outcome: "failed", reason: "exception" } };
  }
}
