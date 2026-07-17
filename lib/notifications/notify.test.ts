import { test } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";

import { notifyPaymentConfirmed, notifyReservationConfirmed } from "./notify.ts";

function createMockSupabase() {
  const claimedKeys = new Set<string>();
  const claimCalls: Array<Record<string, unknown>> = [];
  const completeCalls: Array<Record<string, unknown>> = [];
  let id = 0;

  const client = {
    async rpc(name: string, args: Record<string, unknown>) {
      if (name === "claim_notification_attempt") {
        claimCalls.push(args);
        const key = `${args.p_channel}:${args.p_delivery_mode}:${args.p_deduplication_key}`;
        if (claimedKeys.has(key)) {
          return { data: [{ id: `row-${id}`, claim_token: null, attempt_count: 1, claimed: false }], error: null };
        }
        claimedKeys.add(key);
        id += 1;
        return { data: [{ id: `row-${id}`, claim_token: `token-${id}`, attempt_count: 1, claimed: true }], error: null };
      }
      if (name === "complete_notification_attempt") {
        completeCalls.push(args);
        return { data: true, error: null };
      }
      throw new Error(`RPC no mockeada: ${name}`);
    },
  };

  return {
    client: client as unknown as SupabaseClient,
    claimCalls,
    completeCalls,
  };
}

const reservationParams = {
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
  transferHolder: "Menesteres",
  transferAlias: "alias",
  transferCvu: "cvu",
  transferBank: "Banco",
};

test("la confirmación de reserva envía email y registra el intento", async () => {
  const { client, claimCalls, completeCalls } = createMockSupabase();
  const sent: unknown[] = [];

  const result = await notifyReservationConfirmed(client, reservationParams, {
    sendEmailReservaConfirmacion: async (data) => {
      sent.push(data);
      return { success: true };
    },
  });

  assert.equal(result.email.outcome, "sent");
  assert.equal(sent.length, 1);
  assert.equal(claimCalls[0].p_channel, "email");
  assert.equal(completeCalls[0].p_status, "sent");
});

test("una reserva repetida no genera un segundo email", async () => {
  const { client } = createMockSupabase();
  let sends = 0;
  const deps = {
    sendEmailReservaConfirmacion: async () => {
      sends += 1;
      return { success: true };
    },
  };

  const first = await notifyReservationConfirmed(client, reservationParams, deps);
  const second = await notifyReservationConfirmed(client, reservationParams, deps);

  assert.equal(first.email.outcome, "sent");
  assert.equal(second.email.outcome, "not_claimed");
  assert.equal(sends, 1);
});

test("un error de Resend queda como fallido y reintentable", async () => {
  const { client, completeCalls } = createMockSupabase();
  const result = await notifyReservationConfirmed(client, reservationParams, {
    sendEmailReservaConfirmacion: async () => ({ success: false, error: "resend caído" }),
  });

  assert.equal(result.email.outcome, "failed");
  assert.equal(completeCalls[0].p_status, "failed");
  assert.equal(completeCalls[0].p_retryable, true);
});

test("la confirmación de pago también se deduplica por email", async () => {
  const { client } = createMockSupabase();
  let sends = 0;
  const params = {
    reservationId: "res-1",
    classId: "class-1",
    customerName: "Ana",
    customerEmail: "ana@example.com",
    className: "Cocina italiana",
    classDateISO: "2026-08-01",
    classStartTime: "10:00:00",
    classEndTime: "12:00:00",
    spots: 2,
  };
  const deps = {
    sendEmailReservaConfirmada: async () => {
      sends += 1;
      return { success: true };
    },
  };

  const first = await notifyPaymentConfirmed(client, params, deps);
  const second = await notifyPaymentConfirmed(client, params, deps);

  assert.equal(first.email.outcome, "sent");
  assert.equal(second.email.outcome, "not_claimed");
  assert.equal(sends, 1);
});
