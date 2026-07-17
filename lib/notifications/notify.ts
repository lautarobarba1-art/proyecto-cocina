import type { SupabaseClient } from "@supabase/supabase-js";

import { claimNotification, completeNotification } from "./claim.ts";
import {
  buildPagoConfirmadoKey,
  buildReservaConfirmadaKey,
  buildRecordatorioKey,
} from "./idempotency.ts";
import type { ClaimNotificationResult } from "./types.ts";
import type {
  EmailReservaConfirmacionData,
  EmailPagoConfirmadoData,
  EmailRecordatorioData,
} from "../resend/template.ts";

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

export interface NotifyDeps {
  sendEmailReservaConfirmacion?: SendEmailReservaConfirmacionFn;
  sendEmailReservaConfirmada?: SendEmailReservaConfirmadaFn;
  sendEmailRecordatorio?: SendEmailRecordatorioFn;
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
