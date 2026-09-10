/* eslint-disable @typescript-eslint/no-unused-vars -- los mocks replican la firma fluida de Supabase; varios parámetros existen solo para matchear esa forma */
import { test } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";

import { runNotificationRetries } from "./retry-dispatch.ts";

interface MockReservation {
  id: string;
  class_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  spots: number;
  classes: {
    title: string;
    date: string;
    start_time: string | null;
    end_time: string | null;
    deposit_amount: number | string | null;
  } | null;
}

function createMockSupabase(opts: {
  failedRows?: Record<string, unknown>[];
  reservations?: Record<string, MockReservation>;
  inquiries?: Record<string, Record<string, unknown>>;
}) {
  const failedRows = opts.failedRows ?? [];
  const reservations = opts.reservations ?? {};
  const inquiries = opts.inquiries ?? {};

  const claimedKeys = new Set<string>();
  const claimCalls: Array<Record<string, unknown>> = [];
  const completeCalls: Array<Record<string, unknown>> = [];
  let idCounter = 0;

  function singleRowBuilder(store: Record<string, unknown>) {
    let wantedId: string | null = null;
    const b = {
      select: (_cols: string) => b,
      eq: (col: string, val: string) => {
        if (col === "id") wantedId = val;
        return b;
      },
      async maybeSingle() {
        return { data: (wantedId && store[wantedId]) || null, error: null };
      },
    };
    return b;
  }

  function notificationLogBuilder() {
    const b = {
      select: (_cols: string) => b,
      eq: (_c: string, _v: unknown) => b,
      lte: (_c: string, _v: unknown) => b,
      order: (_c: string, _o: unknown) => b,
      limit: (_n: number) =>
        Promise.resolve({ data: failedRows, error: null }),
    };
    return b;
  }

  const client = {
    from(table: string) {
      if (table === "notification_log") return notificationLogBuilder();
      if (table === "reservations")
        return singleRowBuilder(reservations as Record<string, unknown>);
      if (table === "inquiries")
        return singleRowBuilder(inquiries as Record<string, unknown>);
      throw new Error(`from() no mockeado: ${table}`);
    },
    async rpc(name: string, args: Record<string, unknown>) {
      if (name === "claim_notification_attempt") {
        claimCalls.push(args);
        const key = `${args.p_channel}:${args.p_delivery_mode}:${args.p_deduplication_key}`;
        if (claimedKeys.has(key)) {
          return {
            data: [{ id: `row-${idCounter}`, claim_token: null, attempt_count: 2, claimed: false }],
            error: null,
          };
        }
        claimedKeys.add(key);
        idCounter += 1;
        return {
          data: [{ id: `row-${idCounter}`, claim_token: `token-${idCounter}`, attempt_count: 2, claimed: true }],
          error: null,
        };
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

const reservationRow = (over: Partial<MockReservation> = {}): MockReservation => ({
  id: "res-1",
  class_id: "class-1",
  customer_name: "Ana",
  customer_email: "ana@example.com",
  customer_phone: "+54 9 3492 111111",
  spots: 2,
  classes: {
    title: "Cocina italiana",
    date: "2026-08-01",
    start_time: "10:00:00",
    end_time: "12:00:00",
    deposit_amount: 5000,
  },
  ...over,
});

const failedRow = (over: Record<string, unknown> = {}) => ({
  id: "log-1",
  event_type: "reserva_confirmada",
  template_name: "reserva_confirmacion",
  deduplication_key: "reserva_confirmada:res-1",
  recipient: "ana@example.com",
  reservation_id: "res-1",
  class_id: "class-1",
  attempt_count: 2,
  max_attempts: 5,
  payload: {},
  ...over,
});

test("reintenta un 'reserva_confirmada' fallido reconstruyendo params desde la DB", async () => {
  const { client } = createMockSupabase({
    failedRows: [failedRow()],
    reservations: { "res-1": reservationRow() },
  });

  const metrics = await runNotificationRetries(client, {
    sendEmailReservaConfirmacion: async () => ({ success: true }),
  });

  assert.equal(metrics.checked, 1);
  assert.equal(metrics.retried, 1);
  assert.equal(metrics.stillFailing, 0);
});

test("distingue 'cancelacion' manual de expiración por el template_name", async () => {
  const expiredCalls: string[] = [];
  const manualCalls: string[] = [];
  const { client } = createMockSupabase({
    failedRows: [
      failedRow({
        id: "log-exp",
        event_type: "cancelacion",
        template_name: "reserva_cancelada_falta_comprobante",
        deduplication_key: "cancelacion:res-1",
        reservation_id: "res-1",
      }),
      failedRow({
        id: "log-man",
        event_type: "cancelacion",
        template_name: "reserva_cancelada",
        deduplication_key: "cancelacion:res-2",
        reservation_id: "res-2",
      }),
    ],
    reservations: {
      "res-1": reservationRow({ id: "res-1" }),
      "res-2": reservationRow({ id: "res-2" }),
    },
  });

  const metrics = await runNotificationRetries(client, {
    sendEmailReservaCanceladaPorFaltaComprobante: async () => {
      expiredCalls.push("x");
      return { success: true };
    },
    sendEmailReservaCancelada: async () => {
      manualCalls.push("x");
      return { success: true };
    },
  });

  assert.equal(metrics.retried, 2);
  assert.equal(expiredCalls.length, 1);
  assert.equal(manualCalls.length, 1);
});

test("reintenta 'consulta_nueva_admin' parseando el inquiryId de la dedup key", async (t) => {
  const original = process.env.ADMIN_EMAIL;
  process.env.ADMIN_EMAIL = "admin@example.com";
  t.after(() => {
    process.env.ADMIN_EMAIL = original;
  });

  let sends = 0;
  const { client } = createMockSupabase({
    failedRows: [
      failedRow({
        id: "log-c",
        event_type: "consulta_nueva_admin",
        template_name: "admin_consulta_nueva",
        deduplication_key: "consulta_nueva_admin:inq-9",
        reservation_id: null,
        class_id: null,
      }),
    ],
    inquiries: {
      "inq-9": {
        id: "inq-9",
        customer_name: "Bea",
        customer_email: "bea@example.com",
        type: "espacio",
        payload: { mensaje: "Hola" },
      },
    },
  });

  const metrics = await runNotificationRetries(client, {
    sendEmailAdminConsultaNueva: async () => {
      sends += 1;
      return { success: true };
    },
  });

  assert.equal(metrics.retried, 1);
  assert.equal(sends, 1);
});

test("si la reserva ya no existe, retira la fila permanentemente (retryable=false)", async () => {
  const { client, completeCalls } = createMockSupabase({
    failedRows: [failedRow({ reservation_id: "res-borrada" })],
    reservations: {}, // no está
  });

  const metrics = await runNotificationRetries(client, {
    sendEmailReservaConfirmacion: async () => ({ success: true }),
  });

  assert.equal(metrics.permanentlyRetired, 1);
  assert.equal(metrics.retried, 0);
  assert.equal(completeCalls[0].p_status, "failed");
  assert.equal(completeCalls[0].p_retryable, false);
});

test("una fila 'reprogramacion' sin horarios en el payload (fila vieja) se retira, no se reintenta", async () => {
  const { client } = createMockSupabase({
    failedRows: [
      failedRow({
        event_type: "reprogramacion",
        template_name: "reprogramacion",
        deduplication_key: "reprogramacion:res-1:abcdef",
        payload: { oldDate: "2026-08-01", newDate: "2026-08-05" }, // sin horarios
      }),
    ],
    reservations: { "res-1": reservationRow() },
  });

  const metrics = await runNotificationRetries(client, {
    sendEmailReprogramacion: async () => ({ success: true }),
  });

  assert.equal(metrics.retried, 0);
  assert.equal(metrics.permanentlyRetired, 1);
});

test("una fila 'reprogramacion' con horarios completos sí se reintenta", async () => {
  let sends = 0;
  const { client } = createMockSupabase({
    failedRows: [
      failedRow({
        event_type: "reprogramacion",
        template_name: "reprogramacion",
        deduplication_key: "reprogramacion:res-1:abcdef",
        payload: {
          oldDate: "2026-08-01",
          oldStartTime: "10:00:00",
          oldEndTime: "12:00:00",
          newDate: "2026-08-05",
          newStartTime: "18:00:00",
          newEndTime: "21:00:00",
        },
      }),
    ],
    reservations: { "res-1": reservationRow() },
  });

  const metrics = await runNotificationRetries(client, {
    sendEmailReprogramacion: async () => {
      sends += 1;
      return { success: true };
    },
  });

  assert.equal(metrics.retried, 1);
  assert.equal(sends, 1);
});

test("las filas con reintentos agotados (attempt_count >= max_attempts) se ignoran", async () => {
  const { client, claimCalls } = createMockSupabase({
    failedRows: [failedRow({ attempt_count: 5, max_attempts: 5 })],
    reservations: { "res-1": reservationRow() },
  });

  const metrics = await runNotificationRetries(client, {
    sendEmailReservaConfirmacion: async () => ({ success: true }),
  });

  assert.equal(metrics.checked, 0);
  assert.equal(claimCalls.length, 0);
});

test("un envío que vuelve a fallar en el reintento se cuenta como stillFailing", async () => {
  const { client } = createMockSupabase({
    failedRows: [failedRow()],
    reservations: { "res-1": reservationRow() },
  });

  const metrics = await runNotificationRetries(client, {
    sendEmailReservaConfirmacion: async () => ({ success: false, error: "resend caído otra vez" }),
  });

  assert.equal(metrics.retried, 0);
  assert.equal(metrics.stillFailing, 1);
});
