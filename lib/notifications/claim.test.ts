import { test } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";

import { claimNotification, completeNotification } from "./claim.ts";

/**
 * Estos tests ejercitan la capa TS (claim.ts) contra un mock de Supabase que
 * simula, en cada caso, lo que documentamos que `claim_notification_attempt` /
 * `complete_notification_attempt` devuelven para ese escenario (ver migración
 * 20260709000001_notification_log.sql). No corren contra una base real: la
 * lógica del WHERE de reclamo (backoff, lease vencido, máximo de intentos)
 * vive en SQL y no está cubierta por un test de integración en esta etapa —
 * queda documentado como pendiente antes de conectar envíos reales.
 */

interface RpcCall {
  fn: string;
  args: Record<string, unknown>;
}

function makeMockSupabase(rpcResult: { data: unknown; error: { message: string } | null }) {
  const calls: RpcCall[] = [];
  const client = {
    rpc(fn: string, args: Record<string, unknown>) {
      calls.push({ fn, args });
      return Promise.resolve(rpcResult);
    },
  };
  return { client: client as unknown as SupabaseClient, calls };
}

test("claimNotification manda los parámetros correctos a la RPC con los defaults esperados", async () => {
  const { client, calls } = makeMockSupabase({
    data: [{ id: "log-1", claim_token: "token-abc", attempt_count: 1, claimed: true }],
    error: null,
  });

  const result = await claimNotification(client, {
    channel: "whatsapp",
    deduplicationKey: "reserva_confirmada:res-1",
    eventType: "reserva_confirmada",
    recipient: "5491123456789",
    reservationId: "res-1",
    classId: "class-1",
    templateName: "reserva_confirmada_v1",
    payload: { customerName: "Ana" },
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].fn, "claim_notification_attempt");
  assert.deepEqual(calls[0].args, {
    p_channel: "whatsapp",
    p_deduplication_key: "reserva_confirmada:res-1",
    p_event_type: "reserva_confirmada",
    p_recipient: "5491123456789",
    p_reservation_id: "res-1",
    p_class_id: "class-1",
    p_template_name: "reserva_confirmada_v1",
    p_payload: { customerName: "Ana" },
    p_delivery_mode: "live",
    p_max_attempts: 5,
    p_stale_after_minutes: 10,
  });
  assert.deepEqual(result, { id: "log-1", claimToken: "token-abc", attemptCount: 1, claimed: true });
});

test("claimNotification usa deliveryMode='live' por default y lo pasa explícito cuando se pide 'dry_run'", async () => {
  const { client, calls } = makeMockSupabase({
    data: [{ id: "log-1b", claim_token: "token-dry", attempt_count: 1, claimed: true }],
    error: null,
  });

  await claimNotification(client, {
    channel: "whatsapp",
    deduplicationKey: "reserva_confirmada:res-1",
    eventType: "reserva_confirmada",
    recipient: "5491123456789",
    deliveryMode: "dry_run",
  });

  assert.equal(calls[0].args.p_delivery_mode, "dry_run");
});

test("dry run no bloquea el modo live: son reclamos independientes con delivery_mode distinto para el mismo dedup key", async () => {
  // A nivel TS esto se reduce a que ambos reclamos viajan con su propio
  // p_delivery_mode — la garantía real de que no chocan (UNIQUE por
  // channel+delivery_mode+deduplication_key) es de la migración SQL y está
  // cubierta por el test de integración (supabase/tests/notification_log_integration.sql).
  const dryRun = makeMockSupabase({
    data: [{ id: "log-dry", claim_token: "token-dry", attempt_count: 1, claimed: true }],
    error: null,
  });
  const live = makeMockSupabase({
    data: [{ id: "log-live", claim_token: "token-live", attempt_count: 1, claimed: true }],
    error: null,
  });

  const dedupKey = "pago_confirmado:res-99";

  const dryResult = await claimNotification(dryRun.client, {
    channel: "whatsapp",
    deduplicationKey: dedupKey,
    eventType: "pago_confirmado",
    recipient: "5491123456789",
    deliveryMode: "dry_run",
  });
  const liveResult = await claimNotification(live.client, {
    channel: "whatsapp",
    deduplicationKey: dedupKey,
    eventType: "pago_confirmado",
    recipient: "5491123456789",
    deliveryMode: "live",
  });

  assert.equal(dryRun.calls[0].args.p_delivery_mode, "dry_run");
  assert.equal(live.calls[0].args.p_delivery_mode, "live");
  assert.equal(dryResult.claimed, true);
  assert.equal(liveResult.claimed, true);
});

test("claimNotification sanitiza el payload antes de mandarlo a la RPC (nunca tokens/secretos)", async () => {
  const { client, calls } = makeMockSupabase({
    data: [{ id: "log-1", claim_token: "token-abc", attempt_count: 1, claimed: true }],
    error: null,
  });

  await claimNotification(client, {
    channel: "whatsapp",
    deduplicationKey: "reserva_confirmada:res-1",
    eventType: "reserva_confirmada",
    recipient: "5491123456789",
    payload: { customerName: "Ana", accessToken: "leak-me-not", nested: { a: 1 } },
  });

  assert.deepEqual(calls[0].args.p_payload, { customerName: "Ana" });
});

test("claimNotification respeta maxAttempts/staleAfterMinutes custom y null para ids/plantilla opcionales", async () => {
  const { client, calls } = makeMockSupabase({
    data: [{ id: "log-2", claim_token: "token-xyz", attempt_count: 2, claimed: false }],
    error: null,
  });

  const result = await claimNotification(client, {
    channel: "email",
    deduplicationKey: "recordatorio:res-2:2026-08-01",
    eventType: "recordatorio",
    recipient: "cliente@example.com",
    maxAttempts: 3,
    staleAfterMinutes: 30,
  });

  assert.equal(calls[0].args.p_reservation_id, null);
  assert.equal(calls[0].args.p_class_id, null);
  assert.equal(calls[0].args.p_template_name, null);
  assert.equal(calls[0].args.p_delivery_mode, "live");
  assert.equal(calls[0].args.p_max_attempts, 3);
  assert.equal(calls[0].args.p_stale_after_minutes, 30);
  assert.equal(result.claimed, false);
});

test("claimNotification lanza si la RPC devuelve error", async () => {
  const { client } = makeMockSupabase({ data: null, error: { message: "boom" } });

  await assert.rejects(
    () =>
      claimNotification(client, {
        channel: "whatsapp",
        deduplicationKey: "k",
        eventType: "cancelacion",
        recipient: "5491123456789",
      }),
    /claim_notification_attempt falló: boom/,
  );
});

test("claimNotification lanza si la RPC no devuelve filas", async () => {
  const { client } = makeMockSupabase({ data: [], error: null });

  await assert.rejects(() =>
    claimNotification(client, {
      channel: "whatsapp",
      deduplicationKey: "k",
      eventType: "cancelacion",
      recipient: "5491123456789",
    }),
  );
});

// ─── Escenarios de lease / retry (respuestas simuladas de la RPC) ────────────

test("recuperación de un claim vencido: la RPC reclama de nuevo con un claim_token nuevo y attempt_count incrementado", async () => {
  const { client } = makeMockSupabase({
    data: [{ id: "log-3", claim_token: "token-recovered-2", attempt_count: 2, claimed: true }],
    error: null,
  });

  const result = await claimNotification(client, {
    channel: "whatsapp",
    deduplicationKey: "pago_confirmado:res-3",
    eventType: "pago_confirmado",
    recipient: "5491123456789",
    staleAfterMinutes: 10,
  });

  assert.equal(result.claimed, true);
  assert.equal(result.attemptCount, 2);
  assert.equal(result.claimToken, "token-recovered-2");
});

test("rechazo de un claim todavía vigente: la RPC no reclama y no expone claim_token", async () => {
  const { client } = makeMockSupabase({
    data: [{ id: "log-4", claim_token: null, attempt_count: 1, claimed: false }],
    error: null,
  });

  const result = await claimNotification(client, {
    channel: "whatsapp",
    deduplicationKey: "pago_confirmado:res-4",
    eventType: "pago_confirmado",
    recipient: "5491123456789",
  });

  assert.equal(result.claimed, false);
  assert.equal(result.claimToken, null);
});

test("límite máximo de intentos: attempt_count >= max_attempts no se reclama", async () => {
  const { client, calls } = makeMockSupabase({
    data: [{ id: "log-5", claim_token: null, attempt_count: 3, claimed: false }],
    error: null,
  });

  const result = await claimNotification(client, {
    channel: "whatsapp",
    deduplicationKey: "cancelacion:res-5",
    eventType: "cancelacion",
    recipient: "5491123456789",
    maxAttempts: 3,
  });

  assert.equal(calls[0].args.p_max_attempts, 3);
  assert.equal(result.claimed, false);
  assert.equal(result.attemptCount, 3);
});

test("error permanente (retryable=false) no se reclama de nuevo", async () => {
  const { client } = makeMockSupabase({
    data: [{ id: "log-6", claim_token: null, attempt_count: 1, claimed: false }],
    error: null,
  });

  const result = await claimNotification(client, {
    channel: "whatsapp",
    deduplicationKey: "cancelacion:res-6",
    eventType: "cancelacion",
    recipient: "5491123456789",
  });

  assert.equal(result.claimed, false);
});

test("espera de next_retry_at: una falla recuperable pero con backoff vigente no se reclama todavía", async () => {
  const { client } = makeMockSupabase({
    data: [{ id: "log-7", claim_token: null, attempt_count: 1, claimed: false }],
    error: null,
  });

  const result = await claimNotification(client, {
    channel: "whatsapp",
    deduplicationKey: "cancelacion:res-7",
    eventType: "cancelacion",
    recipient: "5491123456789",
  });

  assert.equal(result.claimed, false);
});

test("eliminación de una reserva sin eliminar su historial: la capa TS admite reservationId null (post-borrado)", async () => {
  // La garantía real (ON DELETE SET NULL, reservation_id nullable) vive en la
  // migración SQL — ver constraint en 20260709000001_notification_log.sql.
  // Este test solo cubre que la capa TS no exige reservation_id ni rompe si
  // viene null, que es la forma en que se ve una fila de notification_log
  // cuya reserva original ya fue borrada. No reemplaza un test de integración
  // contra una base real (pendiente, ver informe de la Etapa 1).
  const { client, calls } = makeMockSupabase({
    data: [{ id: "log-8", claim_token: "token-8", attempt_count: 1, claimed: true }],
    error: null,
  });

  await claimNotification(client, {
    channel: "email",
    deduplicationKey: "cancelacion:res-8",
    eventType: "cancelacion",
    recipient: "cliente@example.com",
    reservationId: null,
  });

  assert.equal(calls[0].args.p_reservation_id, null);
});

// ─── completeNotification: lease y estados terminales ────────────────────────

test("completeNotification manda status/metadata a la RPC, incluyendo retryable y next_retry_at", async () => {
  const { client, calls } = makeMockSupabase({ data: true, error: null });

  const result = await completeNotification(client, {
    id: "log-1",
    claimToken: "token-abc",
    status: "sent",
    providerMessageId: "wamid.abc",
  });

  assert.equal(calls[0].fn, "complete_notification_attempt");
  assert.deepEqual(calls[0].args, {
    p_id: "log-1",
    p_claim_token: "token-abc",
    p_status: "sent",
    p_provider_message_id: "wamid.abc",
    p_error_code: null,
    p_error_message: null,
    p_retryable: null,
    p_next_retry_at: null,
  });
  assert.equal(result.updated, true);
});

test("dry run se registra como 'skipped', nunca como 'sent'", async () => {
  const { client, calls } = makeMockSupabase({ data: true, error: null });

  const result = await completeNotification(client, {
    id: "log-9",
    claimToken: "token-9",
    status: "skipped",
    errorCode: "dry_run",
    errorMessage: "WHATSAPP_DRY_RUN=true: envío simulado, no se llamó a la Graph API",
  });

  assert.equal(calls[0].args.p_status, "skipped");
  assert.notEqual(calls[0].args.p_status, "sent");
  assert.equal(result.updated, true);
});

test("un worker que perdió el lease (fila reclamada por otro proceso) no puede completar: updated=false", async () => {
  const { client } = makeMockSupabase({ data: false, error: null });

  const result = await completeNotification(client, {
    id: "log-10",
    claimToken: "token-viejo-ya-invalidado",
    status: "sent",
    providerMessageId: "wamid.late",
  });

  assert.equal(result.updated, false);
});

test("finalización con un claim_token incorrecto no actualiza nada: updated=false", async () => {
  const { client, calls } = makeMockSupabase({ data: false, error: null });

  const result = await completeNotification(client, {
    id: "log-11",
    claimToken: "token-que-no-coincide",
    status: "failed",
    retryable: false,
    errorCode: "template_rejected",
  });

  assert.equal(calls[0].args.p_claim_token, "token-que-no-coincide");
  assert.equal(result.updated, false);
});

test("completeNotification lanza si la RPC devuelve error", async () => {
  const { client } = makeMockSupabase({ data: null, error: { message: "db down" } });

  await assert.rejects(
    () => completeNotification(client, { id: "log-1", claimToken: "t", status: "failed", retryable: true }),
    /complete_notification_attempt falló: db down/,
  );
});
