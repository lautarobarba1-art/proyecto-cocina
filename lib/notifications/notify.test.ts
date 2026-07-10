import { test } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";

import { notifyReservationConfirmed, notifyPaymentConfirmed } from "./notify.ts";
import type { WhatsAppConfig } from "../whatsapp/config.ts";
import type { SendTemplateMessageResult } from "../whatsapp/client.ts";

/**
 * Mock de Supabase que simula el comportamiento real de
 * claim_notification_attempt / complete_notification_attempt (ver migración
 * 20260709000001_notification_log.sql): una fila por
 * (channel, delivery_mode, deduplication_key), reclamo atómico con
 * claim_token, y reclamo de una fila 'failed' solo si retryable=true y
 * next_retry_at ya venció. No es la base real — es una re-implementación
 * fiel del contrato para poder probar la idempotencia de notify.ts sin
 * Postgres. La integración contra Postgres real de las RPC en sí ya está
 * cubierta en supabase/tests/notification_log_integration.sql (Etapa 1).
 *
 * IMPORTANTE: notify.ts nunca normaliza teléfonos — recibe
 * `customerPhoneNormalized` ya resuelto (E.164 o null), calculado una sola
 * vez en el servidor antes de persistir la reserva (ver
 * create_reservation_atomic / customer_phone_normalized). La validación de
 * formato en sí (qué es "inválido") vive en lib/whatsapp/phone.test.ts.
 */
interface MockRow {
  id: string;
  claimToken: string | null;
  status: string;
  attemptCount: number;
  maxAttempts: number;
  retryable: boolean | null;
  nextRetryAt: string | null;
}

function createMockSupabase() {
  const rows = new Map<string, MockRow>();
  const claimCalls: Array<Record<string, unknown>> = [];
  const completeCalls: Array<Record<string, unknown>> = [];
  let idCounter = 0;
  let tokenCounter = 0;

  const client = {
    rpc(fn: string, args: Record<string, unknown>) {
      if (fn === "claim_notification_attempt") {
        claimCalls.push(args);
        const key = `${args.p_channel}:${args.p_delivery_mode}:${args.p_deduplication_key}`;
        const existing = rows.get(key);

        if (!existing) {
          const row: MockRow = {
            id: `row-${++idCounter}`,
            claimToken: `token-${++tokenCounter}`,
            status: "processing",
            attemptCount: 1,
            maxAttempts: (args.p_max_attempts as number) ?? 5,
            retryable: null,
            nextRetryAt: null,
          };
          rows.set(key, row);
          return Promise.resolve({
            data: [{ id: row.id, claim_token: row.claimToken, attempt_count: row.attemptCount, claimed: true }],
            error: null,
          });
        }

        const staleProcessing = existing.status === "processing"; // simplificado: en los tests no simulamos vencimiento de lease
        const eligibleFailedRetry =
          existing.status === "failed" &&
          existing.retryable === true &&
          existing.attemptCount < existing.maxAttempts &&
          existing.nextRetryAt != null &&
          new Date(existing.nextRetryAt).getTime() <= Date.now();

        if (!staleProcessing && eligibleFailedRetry) {
          existing.status = "processing";
          existing.claimToken = `token-${++tokenCounter}`;
          existing.attemptCount += 1;
          rows.set(key, existing);
          return Promise.resolve({
            data: [{ id: existing.id, claim_token: existing.claimToken, attempt_count: existing.attemptCount, claimed: true }],
            error: null,
          });
        }

        return Promise.resolve({
          data: [{ id: existing.id, claim_token: null, attempt_count: existing.attemptCount, claimed: false }],
          error: null,
        });
      }

      if (fn === "complete_notification_attempt") {
        completeCalls.push(args);
        for (const row of rows.values()) {
          if (row.id !== args.p_id) continue;
          if (row.claimToken !== args.p_claim_token || row.status !== "processing") {
            return Promise.resolve({ data: false, error: null });
          }
          row.status = args.p_status as string;
          row.retryable = (args.p_retryable as boolean | null) ?? null;
          row.nextRetryAt = (args.p_next_retry_at as string | null) ?? null;
          row.claimToken = null;
          return Promise.resolve({ data: true, error: null });
        }
        return Promise.resolve({ data: false, error: null });
      }

      throw new Error(`RPC no mockeada en este test: ${fn}`);
    },
  };

  return {
    client: client as unknown as SupabaseClient,
    claimCalls,
    completeCalls,
    rows,
  };
}

function disabledConfig(): WhatsAppConfig {
  return {
    enabled: false,
    dryRun: true,
    apiVersion: "v21.0",
    accessToken: null,
    phoneNumberId: null,
    businessAccountId: null,
    appSecret: null,
    templates: {
      reserva_confirmada: { eventType: "reserva_confirmada", name: "reserva_confirmada_v1", language: "es_AR" },
      pago_confirmado: { eventType: "pago_confirmado", name: "pago_confirmado_v1", language: "es_AR" },
      recordatorio: { eventType: "recordatorio", name: null, language: "es_AR" },
      cancelacion: { eventType: "cancelacion", name: null, language: "es_AR" },
      reprogramacion: { eventType: "reprogramacion", name: null, language: "es_AR" },
    },
  };
}

function enabledLiveConfig(): WhatsAppConfig {
  return { ...disabledConfig(), enabled: true, dryRun: false };
}

function enabledDryRunConfig(): WhatsAppConfig {
  return { ...disabledConfig(), enabled: true, dryRun: true };
}

function mockSendEmailOk() {
  const calls: unknown[] = [];
  const fn = async (...args: unknown[]) => {
    calls.push(args);
    return { success: true };
  };
  return { fn, calls };
}

function mockSendEmailFail() {
  const calls: unknown[] = [];
  const fn = async (...args: unknown[]) => {
    calls.push(args);
    return { success: false, error: "resend caído" };
  };
  return { fn, calls };
}

function mockSendWhatsApp(result: SendTemplateMessageResult) {
  const calls: unknown[] = [];
  const fn = async (params: unknown) => {
    calls.push(params);
    return result;
  };
  return { fn, calls };
}

const baseReservationParams = {
  reservationId: "res-1",
  classId: "class-1",
  customerName: "Ana",
  customerEmail: "ana@example.com",
  className: "Cocina italiana",
  classDateISO: "2026-08-01",
  classStartTime: "10:00:00",
  classEndTime: "12:00:00",
  spots: 2,
  depositAmount: 5000,
  transferHolder: "Menesteres SRL",
  transferAlias: "menesteres.mp",
  transferCvu: "0000003100000000000001",
  transferBank: "Mercado Pago",
};

const basePaymentParams = {
  reservationId: "res-1",
  classId: "class-1",
  customerName: "Ana",
  customerEmail: "ana@example.com",
  className: "Cocina italiana",
  classDateISO: "2026-08-01",
  classStartTime: "10:00:00",
  classEndTime: "12:00:00",
};

// ─── 1. Reserva sin teléfono ───────────────────────────────────────────────

test("1. reserva sin teléfono: WhatsApp se omite (skipped), no falla nada", async () => {
  const { client } = createMockSupabase();
  const email = mockSendEmailOk();
  const whatsapp = mockSendWhatsApp({ outcome: "sent", success: true, providerMessageId: "wamid.x" });

  const result = await notifyReservationConfirmed(
    client,
    { ...baseReservationParams, customerPhoneNormalized: null, whatsappConsent: true },
    { whatsappConfig: enabledLiveConfig(), sendWhatsApp: whatsapp.fn, sendEmailReservaConfirmacion: email.fn },
  );

  assert.equal(result.whatsapp.outcome, "skipped");
  assert.equal(result.whatsapp.reason, "invalid_or_missing_phone");
  assert.equal(whatsapp.calls.length, 0, "no debe llamarse al proveedor de WhatsApp");
});

// ─── 2. Teléfono válido sin consentimiento ─────────────────────────────────

test("2. teléfono válido sin consentimiento: WhatsApp se omite por consent_missing", async () => {
  const { client } = createMockSupabase();
  const email = mockSendEmailOk();
  const whatsapp = mockSendWhatsApp({ outcome: "sent", success: true, providerMessageId: "wamid.x" });

  const result = await notifyReservationConfirmed(
    client,
    { ...baseReservationParams, customerPhoneNormalized: "5491123456789", whatsappConsent: false },
    { whatsappConfig: enabledLiveConfig(), sendWhatsApp: whatsapp.fn, sendEmailReservaConfirmacion: email.fn },
  );

  assert.equal(result.whatsapp.outcome, "skipped");
  assert.equal(result.whatsapp.reason, "consent_missing");
  assert.equal(whatsapp.calls.length, 0);
});

// ─── 3. Teléfono inválido ingresado ────────────────────────────────────────
// notify.ts ya NO normaliza ni valida formato — eso ocurre una sola vez en
// el servidor, antes de persistir la reserva (app/api/reservations/route.ts
// + create_reservation_atomic), y un teléfono con formato inválido nunca
// llega a crear una reserva (se rechaza con 400 antes). La cobertura de "qué
// cuenta como inválido" vive en lib/whatsapp/phone.test.ts. Acá solo importa
// que, para notify.ts, "no hay un E.164 utilizable" (sea por ausencia o por
// haber sido rechazado antes) se traduce siempre en el mismo skip.

test("3. sin E.164 utilizable (string vacío, equivalente a 'no persistido'): WhatsApp se omite, no se envía", async () => {
  const { client } = createMockSupabase();
  const email = mockSendEmailOk();
  const whatsapp = mockSendWhatsApp({ outcome: "sent", success: true, providerMessageId: "wamid.x" });

  const result = await notifyReservationConfirmed(
    client,
    { ...baseReservationParams, customerPhoneNormalized: "", whatsappConsent: true },
    { whatsappConfig: enabledLiveConfig(), sendWhatsApp: whatsapp.fn, sendEmailReservaConfirmacion: email.fn },
  );

  assert.equal(result.whatsapp.outcome, "skipped");
  assert.equal(result.whatsapp.reason, "invalid_or_missing_phone");
  assert.equal(whatsapp.calls.length, 0);
});

// ─── 4. Teléfono válido con consentimiento ─────────────────────────────────

test("4. teléfono normalizado + consentimiento (config habilitada): WhatsApp se envía con el E.164 persistido", async () => {
  const { client } = createMockSupabase();
  const email = mockSendEmailOk();
  const whatsapp = mockSendWhatsApp({ outcome: "sent", success: true, providerMessageId: "wamid.ok" });

  const result = await notifyReservationConfirmed(
    client,
    { ...baseReservationParams, customerPhoneNormalized: "5491123456789", whatsappConsent: true },
    { whatsappConfig: enabledLiveConfig(), sendWhatsApp: whatsapp.fn, sendEmailReservaConfirmacion: email.fn },
  );

  assert.equal(result.whatsapp.outcome, "sent");
  assert.equal(whatsapp.calls.length, 1);
  assert.equal((whatsapp.calls[0] as { to: string }).to, "5491123456789");
});

// ─── 5. Email enviado aunque WhatsApp se omita ─────────────────────────────

test("5. email se envía aunque WhatsApp se omita por falta de teléfono", async () => {
  const { client } = createMockSupabase();
  const email = mockSendEmailOk();

  const result = await notifyReservationConfirmed(
    client,
    { ...baseReservationParams, customerPhoneNormalized: null, whatsappConsent: false },
    { whatsappConfig: disabledConfig(), sendEmailReservaConfirmacion: email.fn },
  );

  assert.equal(result.email.outcome, "sent");
  assert.equal(email.calls.length, 1);
  assert.equal(result.whatsapp.outcome, "disabled");
});

// ─── 6. WhatsApp fallido no bloquea email ──────────────────────────────────

test("6. WhatsApp fallido no impide que el email se envíe", async () => {
  const { client } = createMockSupabase();
  const email = mockSendEmailOk();
  const whatsapp = mockSendWhatsApp({ outcome: "error", success: false, errorCode: "500", errorMessage: "Internal Server Error" });

  const result = await notifyReservationConfirmed(
    client,
    { ...baseReservationParams, customerPhoneNormalized: "5491123456789", whatsappConsent: true },
    { whatsappConfig: enabledLiveConfig(), sendWhatsApp: whatsapp.fn, sendEmailReservaConfirmacion: email.fn },
  );

  assert.equal(result.whatsapp.outcome, "failed");
  assert.equal(result.email.outcome, "sent");
  assert.equal(email.calls.length, 1);
});

// ─── 7. Email fallido no bloquea WhatsApp ──────────────────────────────────

test("7. email fallido no impide que WhatsApp se intente igual", async () => {
  const { client } = createMockSupabase();
  const email = mockSendEmailFail();
  const whatsapp = mockSendWhatsApp({ outcome: "sent", success: true, providerMessageId: "wamid.ok" });

  const result = await notifyReservationConfirmed(
    client,
    { ...baseReservationParams, customerPhoneNormalized: "5491123456789", whatsappConsent: true },
    { whatsappConfig: enabledLiveConfig(), sendWhatsApp: whatsapp.fn, sendEmailReservaConfirmacion: email.fn },
  );

  assert.equal(result.email.outcome, "failed");
  assert.equal(result.whatsapp.outcome, "sent");
  assert.equal(whatsapp.calls.length, 1);
});

// ─── 8/9. disabled y dry_run: nunca hacen un request HTTP real ─────────────
// Acá NO se inyecta sendWhatsApp: se usa el cliente real
// (sendWhatsAppTemplateMessage) para probar de punta a punta que ni
// 'disabled' ni 'dry_run' llegan a tocar la red. Se pisa `fetch` global para
// que cualquier intento de request explote el test.

test("8. WHATSAPP_ENABLED=false: no se hace ningún request externo (fetch nunca se llama)", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (() => {
    throw new Error("fetch no debería haberse llamado con WHATSAPP_ENABLED=false");
  }) as unknown as typeof fetch;

  try {
    const { client } = createMockSupabase();
    const email = mockSendEmailOk();

    const result = await notifyReservationConfirmed(
      client,
      { ...baseReservationParams, customerPhoneNormalized: "5491123456789", whatsappConsent: true },
      { whatsappConfig: disabledConfig(), sendEmailReservaConfirmacion: email.fn },
    );

    assert.equal(result.whatsapp.outcome, "disabled");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("9. WHATSAPP_ENABLED=true + WHATSAPP_DRY_RUN=true: no se hace ningún request externo (fetch nunca se llama)", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (() => {
    throw new Error("fetch no debería haberse llamado en dry-run");
  }) as unknown as typeof fetch;

  try {
    const { client } = createMockSupabase();
    const email = mockSendEmailOk();

    const result = await notifyReservationConfirmed(
      client,
      { ...baseReservationParams, customerPhoneNormalized: "5491123456789", whatsappConsent: true },
      { whatsappConfig: enabledDryRunConfig(), sendEmailReservaConfirmacion: email.fn },
    );

    assert.equal(result.whatsapp.outcome, "skipped");
    assert.equal(result.whatsapp.reason, "dry_run");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ─── 10. Dry run queda registrado como 'skipped', nunca 'sent' ─────────────

test("10. dry run: la fila de notification_log queda 'skipped', nunca 'sent'", async () => {
  const { client, rows, claimCalls } = createMockSupabase();
  const email = mockSendEmailOk();
  const whatsapp = mockSendWhatsApp({ outcome: "dry_run", success: true, providerMessageId: "dry-run-x" });

  await notifyReservationConfirmed(
    client,
    { ...baseReservationParams, customerPhoneNormalized: "5491123456789", whatsappConsent: true },
    { whatsappConfig: enabledDryRunConfig(), sendWhatsApp: whatsapp.fn, sendEmailReservaConfirmacion: email.fn },
  );

  const whatsappClaim = claimCalls.find((c) => c.p_channel === "whatsapp");
  assert.ok(whatsappClaim);
  assert.equal(whatsappClaim!.p_delivery_mode, "dry_run");

  const key = `${whatsappClaim!.p_channel}:${whatsappClaim!.p_delivery_mode}:${whatsappClaim!.p_deduplication_key}`;
  const whatsappRow = rows.get(key);
  assert.ok(whatsappRow);
  assert.equal(whatsappRow!.status, "skipped");
  assert.notEqual(whatsappRow!.status, "sent");
});

// ─── 3 (WhatsApp deshabilitado). disabled no reclama; después dry_run y live SÍ, sobre la misma key ──

test("disabled no crea claim de notification_log; dry_run y live pueden reclamar después la MISMA deduplication_key sin bloquearse entre sí", async () => {
  const { client, claimCalls } = createMockSupabase();
  const email = mockSendEmailOk();
  const params = { ...baseReservationParams, customerPhoneNormalized: "5491123456789", whatsappConsent: true };

  // 1) disabled: no debe generar ningún claim de whatsapp.
  const disabledResult = await notifyReservationConfirmed(client, params, {
    whatsappConfig: disabledConfig(),
    sendEmailReservaConfirmacion: email.fn,
  });
  assert.equal(disabledResult.whatsapp.outcome, "disabled");
  assert.equal(
    claimCalls.filter((c) => c.p_channel === "whatsapp").length,
    0,
    "disabled no debe reclamar nada en notification_log",
  );

  // 2) dry_run: ahora sí puede reclamar (nadie ocupó la key en dry_run).
  const dryRunWhatsapp = mockSendWhatsApp({ outcome: "dry_run", success: true, providerMessageId: "dry-run-x" });
  const dryRunResult = await notifyReservationConfirmed(client, params, {
    whatsappConfig: enabledDryRunConfig(),
    sendWhatsApp: dryRunWhatsapp.fn,
    sendEmailReservaConfirmacion: email.fn,
  });
  assert.equal(dryRunResult.whatsapp.outcome, "skipped");
  assert.equal(dryRunResult.whatsapp.reason, "dry_run");
  const dryRunClaims = claimCalls.filter((c) => c.p_channel === "whatsapp" && c.p_delivery_mode === "dry_run");
  assert.equal(dryRunClaims.length, 1);

  // 3) live: la MISMA deduplication_key, delivery_mode='live' — no está
  // bloqueada por el intento dry_run anterior (fila distinta).
  const liveWhatsapp = mockSendWhatsApp({ outcome: "sent", success: true, providerMessageId: "wamid.live" });
  const liveResult = await notifyReservationConfirmed(client, params, {
    whatsappConfig: enabledLiveConfig(),
    sendWhatsApp: liveWhatsapp.fn,
    sendEmailReservaConfirmacion: email.fn,
  });
  assert.equal(liveResult.whatsapp.outcome, "sent");
  const liveClaims = claimCalls.filter((c) => c.p_channel === "whatsapp" && c.p_delivery_mode === "live");
  assert.equal(liveClaims.length, 1);

  const dedupKeys = new Set(claimCalls.filter((c) => c.p_channel === "whatsapp").map((c) => c.p_deduplication_key));
  assert.equal(dedupKeys.size, 1, "los 3 intentos comparten la misma deduplication_key");
});

// ─── 11/12. Duplicados: no se envía dos veces ──────────────────────────────

test("11. confirmación de reserva duplicada: la segunda llamada no vuelve a enviar por ningún canal", async () => {
  const { client } = createMockSupabase();
  const email = mockSendEmailOk();
  const whatsapp = mockSendWhatsApp({ outcome: "sent", success: true, providerMessageId: "wamid.ok" });
  const params = { ...baseReservationParams, customerPhoneNormalized: "5491123456789", whatsappConsent: true };
  const deps = { whatsappConfig: enabledLiveConfig(), sendWhatsApp: whatsapp.fn, sendEmailReservaConfirmacion: email.fn };

  const first = await notifyReservationConfirmed(client, params, deps);
  const second = await notifyReservationConfirmed(client, params, deps);

  assert.equal(first.email.outcome, "sent");
  assert.equal(first.whatsapp.outcome, "sent");
  assert.equal(second.email.outcome, "not_claimed");
  assert.equal(second.whatsapp.outcome, "not_claimed");
  assert.equal(email.calls.length, 1, "el proveedor de email solo se llama una vez");
  assert.equal(whatsapp.calls.length, 1, "el proveedor de WhatsApp solo se llama una vez");
});

test("12. confirmación de pago duplicada: la segunda llamada no vuelve a enviar por ningún canal", async () => {
  const { client } = createMockSupabase();
  const email = mockSendEmailOk();
  const whatsapp = mockSendWhatsApp({ outcome: "sent", success: true, providerMessageId: "wamid.ok" });
  const params = { ...basePaymentParams, customerPhoneNormalized: "5491123456789", whatsappConsent: true };
  const deps = { whatsappConfig: enabledLiveConfig(), sendWhatsApp: whatsapp.fn, sendEmailReservaConfirmada: email.fn };

  const first = await notifyPaymentConfirmed(client, params, deps);
  const second = await notifyPaymentConfirmed(client, params, deps);

  assert.equal(first.email.outcome, "sent");
  assert.equal(first.whatsapp.outcome, "sent");
  assert.equal(second.email.outcome, "not_claimed");
  assert.equal(second.whatsapp.outcome, "not_claimed");
  assert.equal(email.calls.length, 1);
  assert.equal(whatsapp.calls.length, 1);
});

// ─── 13/14. Transición real a 'confirmed' / reserva ya confirmada ─────────
// Cubierto con pruebas reales (no omitidas) en
// lib/admin/reservas-actions.test.ts, sobre confirmReservationPayment — la
// función que efectivamente hace el UPDATE ... WHERE status='pending' y
// decide si llama a notifyPaymentConfirmed.

// ─── 15. Error del proveedor marcado recuperable ───────────────────────────

test("15. error recuperable (5xx) queda persistido con retryable=true y next_retry_at futuro", async () => {
  const { client, completeCalls } = createMockSupabase();
  const email = mockSendEmailOk();
  const whatsapp = mockSendWhatsApp({ outcome: "error", success: false, errorCode: "503", errorMessage: "Service Unavailable" });

  await notifyReservationConfirmed(
    client,
    { ...baseReservationParams, customerPhoneNormalized: "5491123456789", whatsappConsent: true },
    { whatsappConfig: enabledLiveConfig(), sendWhatsApp: whatsapp.fn, sendEmailReservaConfirmacion: email.fn },
  );

  const whatsappComplete = completeCalls.find((c) => c.p_error_code === "503");
  assert.ok(whatsappComplete);
  assert.equal(whatsappComplete!.p_status, "failed");
  assert.equal(whatsappComplete!.p_retryable, true);
  assert.ok(whatsappComplete!.p_next_retry_at, "debe traer un next_retry_at futuro");
  assert.ok(new Date(whatsappComplete!.p_next_retry_at as string).getTime() > Date.now());
});

// ─── 16. Error permanente sin reintento ────────────────────────────────────

test("16. error permanente (config inválida) queda persistido con retryable=false y no se vuelve a reclamar", async () => {
  const { client, completeCalls } = createMockSupabase();
  const email = mockSendEmailOk();
  const whatsapp = mockSendWhatsApp({ outcome: "error", success: false, errorCode: "config_invalid", errorMessage: "Falta WHATSAPP_ACCESS_TOKEN" });
  const params = { ...baseReservationParams, customerPhoneNormalized: "5491123456789", whatsappConsent: true };
  const deps = { whatsappConfig: enabledLiveConfig(), sendWhatsApp: whatsapp.fn, sendEmailReservaConfirmacion: email.fn };

  await notifyReservationConfirmed(client, params, deps);
  const whatsappComplete = completeCalls.find((c) => c.p_error_code === "config_invalid");
  assert.ok(whatsappComplete);
  assert.equal(whatsappComplete!.p_status, "failed");
  assert.equal(whatsappComplete!.p_retryable, false);
  assert.equal(whatsappComplete!.p_next_retry_at, null);

  // Reintentar el mismo evento no debería volver a llamar al proveedor una
  // segunda vez (la primera llamada, arriba, sí lo llamó una vez — así es
  // como se generó el error a clasificar).
  const secondResult = await notifyReservationConfirmed(client, params, deps);
  assert.equal(secondResult.whatsapp.outcome, "not_claimed");
  assert.equal(whatsapp.calls.length, 1, "el proveedor no se vuelve a llamar tras un error permanente");
});

// ─── 17. Payload sanitizado ─────────────────────────────────────────────────

test("17. el payload persistido no incluye teléfono, email, ni datos bancarios", async () => {
  const { client, claimCalls } = createMockSupabase();
  const email = mockSendEmailOk();
  const whatsapp = mockSendWhatsApp({ outcome: "sent", success: true, providerMessageId: "wamid.ok" });

  await notifyReservationConfirmed(
    client,
    { ...baseReservationParams, customerPhoneNormalized: "5491123456789", whatsappConsent: true },
    { whatsappConfig: enabledLiveConfig(), sendWhatsApp: whatsapp.fn, sendEmailReservaConfirmacion: email.fn },
  );

  for (const call of claimCalls) {
    const payload = JSON.stringify(call.p_payload);
    assert.doesNotMatch(payload, /5491123456789/, "el payload no debe repetir el teléfono (ya está en recipient)");
    assert.doesNotMatch(payload, /ana@example\.com/, "el payload no debe repetir el email (ya está en recipient)");
    assert.doesNotMatch(payload, /menesteres\.mp|0000003100000000000001|Mercado Pago/i, "el payload no debe traer datos bancarios");
  }

  const whatsappClaim = claimCalls.find((c) => c.p_channel === "whatsapp");
  assert.deepEqual(whatsappClaim!.p_payload, {
    customerName: "Ana",
    className: "Cocina italiana",
    classDate: "1 de agosto de 2026",
    classTime: "10:00 - 12:00",
    spots: 2,
  });
});

// ─── 18. Fecha y hora con timezone correcto ────────────────────────────────

test("18. la fecha/hora que viaja al payload de WhatsApp usa el formatter de zona comercial (sin corrimiento)", async () => {
  const { client, claimCalls } = createMockSupabase();
  const email = mockSendEmailOk();
  const whatsapp = mockSendWhatsApp({ outcome: "sent", success: true, providerMessageId: "wamid.ok" });

  await notifyReservationConfirmed(
    client,
    {
      ...baseReservationParams,
      classDateISO: "2027-01-01",
      classStartTime: "09:00:00",
      classEndTime: "11:30:00",
      customerPhoneNormalized: "5491123456789",
      whatsappConsent: true,
    },
    { whatsappConfig: enabledLiveConfig(), sendWhatsApp: whatsapp.fn, sendEmailReservaConfirmacion: email.fn },
  );

  const whatsappClaim = claimCalls.find((c) => c.p_channel === "whatsapp");
  const payload = whatsappClaim!.p_payload as { classDate: string; classTime: string };
  assert.equal(payload.classDate, "1 de enero de 2027");
  assert.equal(payload.classTime, "09:00 - 11:30");
});
