/* eslint-disable @typescript-eslint/no-unused-vars -- el mock replica la firma fluida de Supabase (.from().update().eq().eq().select().maybeSingle()); los parámetros existen solo para matchear esa forma, el mock no filtra por ellos */
import { test } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";

import { confirmReservationPayment } from "./reservas-actions.ts";
import type { NotifyResult } from "../notifications/notify.ts";

/**
 * Mock del query builder fluido de Supabase, acotado a exactamente las dos
 * cadenas que usa confirmReservationPayment:
 *   from("reservations").update(...).eq(...).eq(...).select(...).maybeSingle()
 *   from("classes").select(...).eq(...).maybeSingle()
 *
 * `pendingRow` simula el estado ANTES del UPDATE: si es null, representa que
 * la fila no existe o no está en 'pending' (ya confirmada/cancelada) — el
 * UPDATE ... WHERE status='pending' real no matchearía nada, así que el
 * mock devuelve data:null, igual que Postgres. Cada llamada exitosa
 * "consume" la fila (la deja en null), simulando que una segunda llamada
 * ya no encuentra nada en 'pending' — así se prueba la repetición sin
 * necesitar dos mocks distintos.
 */
function createMockSupabase(options: {
  pendingRow: Record<string, unknown> | null;
  updateShouldError?: boolean;
  classRow?: Record<string, unknown> | null;
}) {
  let currentPendingRow = options.pendingRow;
  let updateCallCount = 0;

  const client = {
    from(table: string) {
      if (table === "reservations") {
        return {
          update(_patch: Record<string, unknown>) {
            return {
              eq(_col1: string, _val1: unknown) {
                return {
                  eq(_col2: string, _val2: unknown) {
                    return {
                      select(_cols: string) {
                        return {
                          async maybeSingle() {
                            updateCallCount++;
                            if (options.updateShouldError) {
                              return { data: null, error: { message: "db down" } };
                            }
                            if (!currentPendingRow) {
                              return { data: null, error: null };
                            }
                            const row = currentPendingRow;
                            currentPendingRow = null; // se "consume": no vuelve a matchear
                            return { data: { ...row, status: "confirmed" }, error: null };
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
      }
      if (table === "classes") {
        return {
          select(_cols: string) {
            return {
              eq(_col: string, _val: unknown) {
                return {
                  async maybeSingle() {
                    return { data: options.classRow ?? null, error: null };
                  },
                };
              },
            };
          },
        };
      }
      throw new Error(`from() no mockeado para tabla: ${table}`);
    },
  };

  return { client: client as unknown as SupabaseClient, getUpdateCallCount: () => updateCallCount };
}

function mockNotify(result: NotifyResult) {
  const calls: unknown[] = [];
  const fn = async (..._args: unknown[]) => {
    calls.push(_args);
    return result;
  };
  return { fn, calls };
}

const SENT_RESULT: NotifyResult = {
  email: { outcome: "sent" },
};

const baseRow = {
  id: "res-1",
  customer_name: "Ana",
  customer_email: "ana@example.com",
  class_id: "class-1",
};

// ─── pending -> confirmed ───────────────────────────────────────────────────

test("pending -> confirmed: persiste (status='confirmed') y ejecuta notifyPaymentConfirmed exactamente una vez", async () => {
  const { client } = createMockSupabase({
    pendingRow: baseRow,
    classRow: { title: "Cocina italiana", date: "2026-08-01", start_time: "10:00:00", end_time: "12:00:00" },
  });
  const notify = mockNotify(SENT_RESULT);

  const result = await confirmReservationPayment(client, "res-1", { notifyPaymentConfirmed: notify.fn });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.status, "confirmed");
    assert.deepEqual(result.notifyResult, SENT_RESULT);
  }
  assert.equal(notify.calls.length, 1);
});

// ─── reserva ya confirmed ───────────────────────────────────────────────────

test("reserva ya confirmada: devuelve conflicto (not_pending_or_not_found) y NO notifica", async () => {
  // pendingRow=null simula que el UPDATE ... WHERE status='pending' no
  // matcheó nada porque la fila ya estaba 'confirmed'.
  const { client } = createMockSupabase({ pendingRow: null });
  const notify = mockNotify(SENT_RESULT);

  const result = await confirmReservationPayment(client, "res-1", { notifyPaymentConfirmed: notify.fn });

  assert.deepEqual(result, { ok: false, reason: "not_pending_or_not_found" });
  assert.equal(notify.calls.length, 0);
});

// ─── update sin filas (no existe) ──────────────────────────────────────────

test("update sin filas (reserva inexistente): NO notifica", async () => {
  const { client } = createMockSupabase({ pendingRow: null });
  const notify = mockNotify(SENT_RESULT);

  const result = await confirmReservationPayment(client, "id-que-no-existe", { notifyPaymentConfirmed: notify.fn });

  assert.equal(result.ok, false);
  assert.equal(notify.calls.length, 0);
});

// ─── error de base de datos ─────────────────────────────────────────────────

test("error de base de datos en el UPDATE: NO notifica, devuelve db_error", async () => {
  const { client } = createMockSupabase({ pendingRow: baseRow, updateShouldError: true });
  const notify = mockNotify(SENT_RESULT);

  const result = await confirmReservationPayment(client, "res-1", { notifyPaymentConfirmed: notify.fn });

  assert.deepEqual(result, { ok: false, reason: "db_error" });
  assert.equal(notify.calls.length, 0);
});

// ─── repetición de la acción ─────────────────────────────────────────────────

test("repetición de la acción (doble click / POST repetido): la segunda llamada no genera un segundo email", async () => {
  const { client, getUpdateCallCount } = createMockSupabase({
    pendingRow: baseRow,
    classRow: { title: "Cocina italiana", date: "2026-08-01", start_time: "10:00:00", end_time: "12:00:00" },
  });
  const notify = mockNotify(SENT_RESULT);

  const first = await confirmReservationPayment(client, "res-1", { notifyPaymentConfirmed: notify.fn });
  const second = await confirmReservationPayment(client, "res-1", { notifyPaymentConfirmed: notify.fn });

  assert.equal(first.ok, true);
  assert.equal(second.ok, false);
  if (!second.ok) assert.equal(second.reason, "not_pending_or_not_found");

  assert.equal(getUpdateCallCount(), 2, "el UPDATE se intenta las dos veces (así es como Postgres lo vería también)");
  assert.equal(notify.calls.length, 1, "notifyPaymentConfirmed solo se llama en el primer intento exitoso");
});

// ─── notify explota: no debe filtrar la excepción ni romper la respuesta ───

test("si notifyPaymentConfirmed lanza, confirmReservationPayment igual devuelve ok:true (el pago ya quedó persistido)", async () => {
  const { client } = createMockSupabase({
    pendingRow: baseRow,
    classRow: { title: "Cocina italiana", date: "2026-08-01", start_time: "10:00:00", end_time: "12:00:00" },
  });
  const throwingNotify = async () => {
    throw new Error("boom");
  };

  const result = await confirmReservationPayment(client, "res-1", { notifyPaymentConfirmed: throwingNotify });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.notifyResult.email.outcome, "failed");
  }
});
