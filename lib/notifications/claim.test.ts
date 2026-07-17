import { test } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";

import { claimNotification, completeNotification } from "./claim.ts";

function makeMockSupabase(result: { data: unknown; error: { message: string } | null }) {
  const calls: Array<{ fn: string; args: Record<string, unknown> }> = [];
  const client = {
    async rpc(fn: string, args: Record<string, unknown>) {
      calls.push({ fn, args });
      return result;
    },
  };
  return { client: client as unknown as SupabaseClient, calls };
}

test("claimNotification envía a la RPC los datos del email sanitizados", async () => {
  const { client, calls } = makeMockSupabase({
    data: [{ id: "log-1", claim_token: "token-1", attempt_count: 1, claimed: true }],
    error: null,
  });

  const result = await claimNotification(client, {
    channel: "email",
    deduplicationKey: "reserva_confirmada:res-1",
    eventType: "reserva_confirmada",
    recipient: "ana@example.com",
    reservationId: "res-1",
    classId: "class-1",
    templateName: "reserva_confirmacion",
    payload: { customerName: "Ana", accessToken: "no-persistir" },
  });

  assert.deepEqual(result, {
    id: "log-1",
    claimToken: "token-1",
    attemptCount: 1,
    claimed: true,
  });
  assert.equal(calls[0].fn, "claim_notification_attempt");
  assert.equal(calls[0].args.p_channel, "email");
  assert.equal(calls[0].args.p_delivery_mode, "live");
  assert.deepEqual(calls[0].args.p_payload, { customerName: "Ana" });
});

test("claimNotification representa correctamente un reclamo ya resuelto", async () => {
  const { client } = makeMockSupabase({
    data: [{ id: "log-1", claim_token: null, attempt_count: 1, claimed: false }],
    error: null,
  });
  const result = await claimNotification(client, {
    channel: "email",
    deduplicationKey: "pago_confirmado:res-1",
    eventType: "pago_confirmado",
    recipient: "ana@example.com",
  });
  assert.equal(result.claimed, false);
  assert.equal(result.claimToken, null);
});

test("claimNotification propaga errores de la RPC", async () => {
  const { client } = makeMockSupabase({ data: null, error: { message: "db down" } });
  await assert.rejects(
    () => claimNotification(client, {
      channel: "email",
      deduplicationKey: "reserva_confirmada:res-1",
      eventType: "reserva_confirmada",
      recipient: "ana@example.com",
    }),
    /claim_notification_attempt falló: db down/,
  );
});

test("completeNotification completa el lease vigente", async () => {
  const { client, calls } = makeMockSupabase({ data: true, error: null });
  const result = await completeNotification(client, {
    id: "log-1",
    claimToken: "token-1",
    status: "sent",
  });
  assert.equal(result.updated, true);
  assert.equal(calls[0].fn, "complete_notification_attempt");
  assert.equal(calls[0].args.p_status, "sent");
});
