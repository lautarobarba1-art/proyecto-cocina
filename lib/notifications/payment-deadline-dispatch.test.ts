/* eslint-disable @typescript-eslint/no-unused-vars -- el mock replica la firma fluida de Supabase; los parámetros existen solo para matchear esa forma, el mock no filtra por ellos */
import { test } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";

import { runPaymentDeadlineChecks } from "./payment-deadline-dispatch.ts";

/**
 * Mock de Supabase acotado a lo que usa runPaymentDeadlineChecks:
 *   from("reservations").select(...).eq("status","pending").is("comprobante_url", null)
 *   from("reservations").update(...).eq("id",...).eq("status","pending").select("id").maybeSingle()
 *   rpc("claim_notification_attempt" | "complete_notification_attempt")  (vía los notify* reales)
 *
 * El mock IGNORA los filtros de la query de candidatas: siempre devuelve
 * `candidateRows` tal cual. El filtrado por edad (ventana 23-25h, corte 48h)
 * lo hace el código bajo prueba, no el mock.
 */
function createMockSupabase(
  candidateRows: Record<string, unknown>[],
  opts: { cancelReturnsNull?: boolean } = {},
) {
  const claimedKeys = new Set<string>();
  const claimCalls: Array<Record<string, unknown>> = [];
  const completeCalls: Array<Record<string, unknown>> = [];
  const updateCalls: Array<Record<string, unknown>> = [];
  let idCounter = 0;

  const client = {
    from(table: string) {
      if (table !== "reservations") {
        throw new Error(`from() no mockeado para tabla: ${table}`);
      }
      return {
        // Query de candidatas: .select().eq().is() -> Promise
        select(_cols: string) {
          return {
            eq(_col: string, _val: unknown) {
              return {
                is(_col2: string, _val2: unknown) {
                  return Promise.resolve({ data: candidateRows, error: null });
                },
              };
            },
          };
        },
        // Cancelación: .update().eq().eq().select().maybeSingle()
        update(payload: Record<string, unknown>) {
          return {
            eq(_col: string, _val: unknown) {
              return {
                eq(_col2: string, _val2: unknown) {
                  return {
                    select(_cols: string) {
                      return {
                        async maybeSingle() {
                          updateCalls.push(payload);
                          if (opts.cancelReturnsNull) {
                            return { data: null, error: null };
                          }
                          return { data: { id: "res-cancelled" }, error: null };
                        },
                      };
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
    async rpc(name: string, args: Record<string, unknown>) {
      if (name === "claim_notification_attempt") {
        claimCalls.push(args);
        const key = `${args.p_channel}:${args.p_delivery_mode}:${args.p_deduplication_key}`;
        if (claimedKeys.has(key)) {
          return {
            data: [{ id: `row-${idCounter}`, claim_token: null, attempt_count: 1, claimed: false }],
            error: null,
          };
        }
        claimedKeys.add(key);
        idCounter += 1;
        return {
          data: [{ id: `row-${idCounter}`, claim_token: `token-${idCounter}`, attempt_count: 1, claimed: true }],
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
    updateCalls,
  };
}

function fakeSenders() {
  let reminders = 0;
  let expirations: Array<[string, string, string]> = [];
  return {
    deps: {
      sendEmailRecordatorioComprobante: async () => {
        reminders += 1;
        return { success: true as const };
      },
      sendEmailReservaCanceladaPorFaltaComprobante: async (
        customerEmail: string,
        customerName: string,
        className: string,
      ) => {
        expirations.push([customerEmail, customerName, className]);
        return { success: true as const };
      },
    },
    getReminders: () => reminders,
    getExpirations: () => expirations,
  };
}

const NOW = new Date("2026-09-10T12:00:00.000Z");

const reserva = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: "res-1",
  class_id: "class-1",
  customer_name: "Ana",
  customer_email: "ana@example.com",
  created_at: "2026-09-09T12:00:00.000Z", // 24h antes de NOW
  classes: { title: "Cocina italiana", deposit_amount: 5000 },
  ...overrides,
});

test("reserva creada hace ~24h sin comprobante: manda el aviso de cancelación al cliente", async () => {
  const { client } = createMockSupabase([reserva()]);
  const s = fakeSenders();

  const metrics = await runPaymentDeadlineChecks(client, NOW, s.deps);

  assert.equal(metrics.candidatesChecked, 1);
  assert.equal(metrics.remindersSent, 1);
  assert.equal(metrics.expired, 0);
  assert.equal(s.getReminders(), 1);
  assert.equal(s.getExpirations().length, 0);
});

test("reserva creada hace 10h: todavía no se avisa nada (fuera de la ventana)", async () => {
  const { client } = createMockSupabase([
    reserva({ created_at: "2026-09-10T02:00:00.000Z" }),
  ]);
  const s = fakeSenders();

  const metrics = await runPaymentDeadlineChecks(client, NOW, s.deps);

  assert.equal(metrics.candidatesChecked, 1);
  assert.equal(metrics.remindersSent, 0);
  assert.equal(metrics.expired, 0);
  assert.equal(s.getReminders(), 0);
});

test("reserva de 30h (ya pasó la ventana pero < 48h): no se avisa ni se cancela", async () => {
  const { client } = createMockSupabase([
    reserva({ created_at: "2026-09-09T06:00:00.000Z" }),
  ]);
  const s = fakeSenders();

  const metrics = await runPaymentDeadlineChecks(client, NOW, s.deps);

  assert.equal(metrics.remindersSent, 0);
  assert.equal(metrics.expired, 0);
  assert.equal(s.getReminders(), 0);
  assert.equal(s.getExpirations().length, 0);
});

test("reserva creada hace 50h sin comprobante: se cancela y se avisa al cliente", async () => {
  const { client, updateCalls } = createMockSupabase([
    reserva({ created_at: "2026-09-08T10:00:00.000Z" }),
  ]);
  const s = fakeSenders();

  const metrics = await runPaymentDeadlineChecks(client, NOW, s.deps);

  assert.equal(metrics.expired, 1);
  assert.equal(metrics.remindersSent, 0);
  assert.equal(updateCalls.length, 1);
  assert.equal(updateCalls[0].status, "cancelled");
  assert.equal(s.getExpirations().length, 1);
  assert.deepEqual(s.getExpirations()[0], ["ana@example.com", "Ana", "Cocina italiana"]);
});

test("dos corridas seguidas de una reserva a 24h: la segunda no reenvía (dedup por notification_log)", async () => {
  const { client } = createMockSupabase([reserva()]);
  const s = fakeSenders();

  const primera = await runPaymentDeadlineChecks(client, NOW, s.deps);
  const segunda = await runPaymentDeadlineChecks(client, NOW, s.deps);

  assert.equal(primera.remindersSent, 1);
  assert.equal(segunda.remindersSent, 0);
  assert.equal(segunda.remindersSkipped, 1);
  assert.equal(s.getReminders(), 1, "el email real se manda una sola vez");
});

test("si otra corrida ya resolvió la reserva (el UPDATE no matchea), no se cuenta como expirada ni se avisa", async () => {
  const { client } = createMockSupabase(
    [reserva({ created_at: "2026-09-08T10:00:00.000Z" })],
    { cancelReturnsNull: true },
  );
  const s = fakeSenders();

  const metrics = await runPaymentDeadlineChecks(client, NOW, s.deps);

  assert.equal(metrics.expired, 0);
  assert.equal(s.getExpirations().length, 0);
});

test("fila con classes:null (JOIN vacío) usa '(clase)' y no rompe", async () => {
  const { client } = createMockSupabase([reserva({ classes: null })]);
  const s = fakeSenders();

  const metrics = await runPaymentDeadlineChecks(client, NOW, s.deps);

  assert.equal(metrics.remindersSent, 1);
  assert.equal(s.getReminders(), 1);
});
