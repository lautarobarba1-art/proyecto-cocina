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
  buildReservaNuevaAdminKey,
  buildConsultaNuevaAdminKey,
  buildResumenAdminKey,
  buildBajaOcupacionKey,
} from "./idempotency.ts";
import type { ClaimNotificationResult } from "./types.ts";
import type {
  EmailReservaConfirmacionData,
  EmailPagoConfirmadoData,
  EmailRecordatorioData,
  EmailRecordatorioComprobanteData,
  EmailReprogramacionData,
  EmailAdminComprobanteSubidoData,
  EmailAdminReservaNuevaData,
  EmailAdminConsultaNuevaData,
  EmailAdminDigestData,
  EmailAdminDigestClase,
  EmailAdminLowOccupancyData,
} from "../resend/template.ts";
import { siteContact } from "../site/contact.ts";

/**
 * Duplicado deliberado de `lib/resend/client.ts#getAdminEmails` (misma
 * lógica, no reexportado): ese módulo hace `requireEnv("FROM_EMAIL")` /
 * `requireEnv("RESEND_API_KEY")` en su nivel superior, así que importarlo acá
 * de forma estática rompería `node --test` (y cualquier test de este archivo)
 * apenas se cargara `notify.ts`, sin necesitar RESEND_API_KEY para nada. Las
 * funciones `sendEmail*` reales ya se cargan con `await import(...)` más
 * abajo por el mismo motivo — esto sigue ese mismo patrón para no romperlo.
 */
function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAIL;
  if (!raw) return [];
  return raw
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

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

type SendEmailAdminReservaNuevaFn = (
  data: EmailAdminReservaNuevaData,
) => Promise<{ success: boolean; error?: string }>;

type SendEmailAdminConsultaNuevaFn = (
  data: EmailAdminConsultaNuevaData,
) => Promise<{ success: boolean; error?: string }>;

type SendEmailAdminDigestFn = (
  data: EmailAdminDigestData,
) => Promise<{ success: boolean; error?: string }>;

type SendEmailAdminLowOccupancyFn = (
  data: EmailAdminLowOccupancyData,
) => Promise<{ success: boolean; error?: string }>;

type SendEmailRecordatorioComprobanteFn = (
  data: EmailRecordatorioComprobanteData,
) => Promise<{ success: boolean; error?: string }>;

type SendEmailReservaCanceladaPorFaltaComprobanteFn = (
  customerEmail: string,
  customerName: string,
  className: string,
) => Promise<{ success: boolean; error?: string }>;

type SendEmailReservaCanceladaFn = (
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
  sendEmailReservaCancelada?: SendEmailReservaCanceladaFn;
  sendEmailAdminReservaNueva?: SendEmailAdminReservaNuevaFn;
  sendEmailAdminConsultaNueva?: SendEmailAdminConsultaNuevaFn;
  sendEmailAdminDigest?: SendEmailAdminDigestFn;
  sendEmailAdminLowOccupancy?: SendEmailAdminLowOccupancyFn;
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

async function defaultSendEmailAdminReservaNueva(
  data: EmailAdminReservaNuevaData,
): Promise<{ success: boolean; error?: string }> {
  const { sendEmailAdminReservaNueva } = await import("../resend/send.ts");
  return sendEmailAdminReservaNueva(data);
}

async function defaultSendEmailAdminConsultaNueva(
  data: EmailAdminConsultaNuevaData,
): Promise<{ success: boolean; error?: string }> {
  const { sendEmailAdminConsultaNueva } = await import("../resend/send.ts");
  return sendEmailAdminConsultaNueva(data);
}

async function defaultSendEmailAdminDigest(
  data: EmailAdminDigestData,
): Promise<{ success: boolean; error?: string }> {
  const { sendEmailAdminDigest } = await import("../resend/send.ts");
  return sendEmailAdminDigest(data);
}

async function defaultSendEmailAdminLowOccupancy(
  data: EmailAdminLowOccupancyData,
): Promise<{ success: boolean; error?: string }> {
  const { sendEmailAdminLowOccupancy } = await import("../resend/send.ts");
  return sendEmailAdminLowOccupancy(data);
}

async function defaultSendEmailReservaCanceladaPorFaltaComprobante(
  customerEmail: string,
  customerName: string,
  className: string,
): Promise<{ success: boolean; error?: string }> {
  const { sendEmailReservaCanceladaPorFaltaComprobante } = await import("../resend/send.ts");
  return sendEmailReservaCanceladaPorFaltaComprobante(customerEmail, customerName, className);
}

async function defaultSendEmailReservaCancelada(
  customerEmail: string,
  customerName: string,
  className: string,
): Promise<{ success: boolean; error?: string }> {
  const { sendEmailReservaCancelada } = await import("../resend/send.ts");
  return sendEmailReservaCancelada(customerEmail, customerName, className);
}

/**
 * Backoff entre reintentos, por número de intento ya consumido: el 1er fallo
 * espera 15 min, el 2do 1 h, el 3ro 4 h, el 4to+ 12 h. El worker de reintentos
 * (`lib/notifications/retry-dispatch.ts`) recién reclama una fila cuando
 * `next_retry_at <= now()`, así que esto evita martillar un envío que falla
 * de forma persistente en cada corrida horaria del cron.
 */
const RETRY_BACKOFF_MINUTES = [15, 60, 240, 720] as const;

function nextRetryAtISO(attemptCount: number): string {
  const idx = Math.min(
    Math.max(attemptCount - 1, 0),
    RETRY_BACKOFF_MINUTES.length - 1,
  );
  return new Date(
    Date.now() + RETRY_BACKOFF_MINUTES[idx] * 60 * 1000,
  ).toISOString();
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
      nextRetryAt: nextRetryAtISO(claim.attemptCount),
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
  const adminEmails = getAdminEmails();
  if (adminEmails.length === 0) {
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
      recipient: adminEmails.join(", "),
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

export interface NotifyAdminNewReservationParams {
  reservationId: string;
  classId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  className: string;
  classDateISO: string;
  spots: number;
  reviewUrl: string;
}

/**
 * Avisa a la admin por email que se creó una reserva nueva (todavía
 * pending, sin comprobante). Sin este aviso, la admin recién se enteraba
 * de una reserva cuando alguien subía un comprobante — si nunca lo subía,
 * la reserva podía quedar invisible para ella indefinidamente. Sin
 * ADMIN_EMAIL configurado, no hace nada (no bloquea la reserva, que ya se
 * creó antes de llamar a esta función).
 */
export async function notifyAdminNewReservation(
  supabase: SupabaseClient,
  params: NotifyAdminNewReservationParams,
  deps: NotifyDeps = {},
): Promise<NotifyResult> {
  const adminEmails = getAdminEmails();
  if (adminEmails.length === 0) {
    console.warn("[notify/email:reserva_nueva_admin] Falta ADMIN_EMAIL — no se avisa");
    return { email: { outcome: "not_claimed" } };
  }

  const sendEmail = deps.sendEmailAdminReservaNueva ?? defaultSendEmailAdminReservaNueva;
  let claim: ClaimNotificationResult;

  try {
    claim = await claimNotification(supabase, {
      channel: "email",
      deduplicationKey: buildReservaNuevaAdminKey(params.reservationId),
      eventType: "reserva_nueva_admin",
      recipient: adminEmails.join(", "),
      reservationId: params.reservationId,
      classId: params.classId,
      templateName: "admin_reserva_nueva",
      payload: {
        customerName: params.customerName,
        className: params.className,
        spots: params.spots,
      },
      deliveryMode: "live",
    });
  } catch (error) {
    console.error("[notify/email:reserva_nueva_admin] claim falló:", errorMessageOf(error));
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
        customerPhone: params.customerPhone,
        className: params.className,
        classDate: formatEmailDateLong(params.classDateISO),
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

export interface NotifyAdminNewInquiryParams {
  inquiryId: string;
  customerName: string;
  customerEmail: string;
  typeLabel: string;
  message: string | null;
  reviewUrl: string;
}

/**
 * Avisa a la admin por email que llegó una consulta nueva (contacto, evento
 * privado o alquiler del espacio). Hasta ahora `POST /api/inquiries` no
 * disparaba ningún aviso — la única forma de enterarse era entrar al panel
 * a revisar. Sin ADMIN_EMAIL configurado, no hace nada.
 */
export async function notifyAdminNewInquiry(
  supabase: SupabaseClient,
  params: NotifyAdminNewInquiryParams,
  deps: NotifyDeps = {},
): Promise<NotifyResult> {
  const adminEmails = getAdminEmails();
  if (adminEmails.length === 0) {
    console.warn("[notify/email:consulta_nueva_admin] Falta ADMIN_EMAIL — no se avisa");
    return { email: { outcome: "not_claimed" } };
  }

  const sendEmail = deps.sendEmailAdminConsultaNueva ?? defaultSendEmailAdminConsultaNueva;
  let claim: ClaimNotificationResult;

  try {
    claim = await claimNotification(supabase, {
      channel: "email",
      deduplicationKey: buildConsultaNuevaAdminKey(params.inquiryId),
      eventType: "consulta_nueva_admin",
      recipient: adminEmails.join(", "),
      reservationId: null,
      classId: null,
      templateName: "admin_consulta_nueva",
      payload: {
        customerName: params.customerName,
        typeLabel: params.typeLabel,
      },
      deliveryMode: "live",
    });
  } catch (error) {
    console.error("[notify/email:consulta_nueva_admin] claim falló:", errorMessageOf(error));
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
        typeLabel: params.typeLabel,
        message: params.message,
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

export interface NotifyAdminDigestParams {
  dateISO: string;
  dateLabel: string;
  comprobantesPendientes: number;
  consultasNuevas: number;
  proximasClases: EmailAdminDigestClase[];
  fallasPermanentes: number;
  panelUrl: string;
}

/**
 * Resumen diario al admin. El disparo (¿son las 8:00 AR? ¿hay algo que
 * reportar?) lo decide `lib/notifications/admin-digest-dispatch.ts` — esta
 * función solo dedupe por fecha y manda. Sin ADMIN_EMAIL, no hace nada.
 */
export async function notifyAdminDigest(
  supabase: SupabaseClient,
  params: NotifyAdminDigestParams,
  deps: NotifyDeps = {},
): Promise<NotifyResult> {
  const adminEmails = getAdminEmails();
  if (adminEmails.length === 0) {
    console.warn("[notify/email:resumen_admin] Falta ADMIN_EMAIL — no se avisa");
    return { email: { outcome: "not_claimed" } };
  }

  const sendEmail = deps.sendEmailAdminDigest ?? defaultSendEmailAdminDigest;
  let claim: ClaimNotificationResult;

  try {
    claim = await claimNotification(supabase, {
      channel: "email",
      deduplicationKey: buildResumenAdminKey(params.dateISO),
      eventType: "resumen_admin",
      recipient: adminEmails.join(", "),
      reservationId: null,
      classId: null,
      templateName: "admin_digest",
      payload: {
        comprobantesPendientes: params.comprobantesPendientes,
        consultasNuevas: params.consultasNuevas,
        proximasClases: params.proximasClases.length,
        fallasPermanentes: params.fallasPermanentes,
      },
      deliveryMode: "live",
    });
  } catch (error) {
    console.error("[notify/email:resumen_admin] claim falló:", errorMessageOf(error));
    return { email: { outcome: "failed", reason: "claim_error" } };
  }

  if (!claim.claimed || !claim.claimToken) {
    return { email: { outcome: "not_claimed" } };
  }

  try {
    const result = await withTimeout(
      sendEmail({
        dateLabel: params.dateLabel,
        comprobantesPendientes: params.comprobantesPendientes,
        consultasNuevas: params.consultasNuevas,
        proximasClases: params.proximasClases,
        fallasPermanentes: params.fallasPermanentes,
        panelUrl: params.panelUrl,
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

export interface NotifyLowOccupancyParams {
  classId: string;
  className: string;
  classDateLabel: string;
  spotsLeft: number;
  totalSpots: number;
  occupancyPct: number;
  panelUrl: string;
}

/**
 * Aviso al admin de una clase próxima (4 días) con pocas reservas. Un aviso
 * por clase para siempre (dedup por classId). Sin ADMIN_EMAIL, no hace nada.
 */
export async function notifyLowOccupancy(
  supabase: SupabaseClient,
  params: NotifyLowOccupancyParams,
  deps: NotifyDeps = {},
): Promise<NotifyResult> {
  const adminEmails = getAdminEmails();
  if (adminEmails.length === 0) {
    console.warn("[notify/email:baja_ocupacion] Falta ADMIN_EMAIL — no se avisa");
    return { email: { outcome: "not_claimed" } };
  }

  const sendEmail =
    deps.sendEmailAdminLowOccupancy ?? defaultSendEmailAdminLowOccupancy;
  let claim: ClaimNotificationResult;

  try {
    claim = await claimNotification(supabase, {
      channel: "email",
      deduplicationKey: buildBajaOcupacionKey(params.classId),
      eventType: "baja_ocupacion",
      recipient: adminEmails.join(", "),
      reservationId: null,
      classId: params.classId,
      templateName: "admin_low_occupancy",
      payload: {
        className: params.className,
        occupancyPct: params.occupancyPct,
        spotsLeft: params.spotsLeft,
        totalSpots: params.totalSpots,
      },
      deliveryMode: "live",
    });
  } catch (error) {
    console.error("[notify/email:baja_ocupacion] claim falló:", errorMessageOf(error));
    return { email: { outcome: "failed", reason: "claim_error" } };
  }

  if (!claim.claimed || !claim.claimToken) {
    return { email: { outcome: "not_claimed" } };
  }

  try {
    const result = await withTimeout(
      sendEmail({
        className: params.className,
        classDateLabel: params.classDateLabel,
        spotsLeft: params.spotsLeft,
        totalSpots: params.totalSpots,
        occupancyPct: params.occupancyPct,
        panelUrl: params.panelUrl,
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

export interface NotifyReservationCancelledParams {
  reservationId: string;
  classId: string;
  customerName: string;
  customerEmail: string;
  className: string;
}

/**
 * Avisa al cliente que su reserva fue cancelada manualmente por la admin
 * (una reserva puntual, o en cascada al cancelar una clase entera). Antes
 * esto llamaba a `sendEmailReservaCancelada` directo, fuera del pipeline: si
 * Resend fallaba, el cliente nunca se enteraba y no quedaba rastro.
 *
 * Reusa el evento 'cancelacion' y `buildCancelacionKey` — igual que
 * `notifyReservationExpired`. Una reserva se cancela una sola vez (por el
 * admin O por vencimiento del cron, nunca las dos), así que compartir la
 * clave es seguro. El `templateName` distinto ('reserva_cancelada' vs
 * 'reserva_cancelada_falta_comprobante') es lo que deja al worker de
 * reintentos saber cuál de las dos funciones volver a llamar.
 */
export async function notifyReservationCancelled(
  supabase: SupabaseClient,
  params: NotifyReservationCancelledParams,
  deps: NotifyDeps = {},
): Promise<NotifyResult> {
  const sendEmail =
    deps.sendEmailReservaCancelada ?? defaultSendEmailReservaCancelada;
  let claim: ClaimNotificationResult;

  try {
    claim = await claimNotification(supabase, {
      channel: "email",
      deduplicationKey: buildCancelacionKey(params.reservationId),
      eventType: "cancelacion",
      recipient: params.customerEmail,
      reservationId: params.reservationId,
      classId: params.classId,
      templateName: "reserva_cancelada",
      payload: {
        customerName: params.customerName,
        className: params.className,
      },
      deliveryMode: "live",
    });
  } catch (error) {
    console.error("[notify/email:cancelacion(manual)] claim falló:", errorMessageOf(error));
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
        // Fecha + horario viejo/nuevo completos: el worker de reintentos
        // (retry-dispatch.ts) los necesita para reconstruir la transición
        // exacta y recomputar la misma dedup key al re-llamar esta función.
        oldDate: params.oldDateISO,
        oldStartTime: params.oldStartTime,
        oldEndTime: params.oldEndTime,
        newDate: params.newDateISO,
        newStartTime: params.newStartTime,
        newEndTime: params.newEndTime,
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
