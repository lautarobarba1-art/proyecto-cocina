/* eslint-disable @typescript-eslint/no-unused-vars -- el mock replica la firma fluida de Supabase (.from().select().eq().gte().lte()); los parámetros existen solo para matchear esa forma, el mock no filtra por ellos */
import { test } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";

import { runClassReminders } from "./reminder-dispatch.ts";

/**
 * Mock de Supabase acotado a lo que usa runClassReminders:
 *   from("reservations").select(...).eq(...).gte(...).lte(...)  (query de candidatas)
 *   rpc("claim_notification_attempt" | "complete_notification_attempt")  (vía notifyClassReminder real)
 *
 * El mock IGNORA los filtros (eq/gte/lte no filtran nada): siempre devuelve
 * `candidateRows` tal cual. El filtrado real (status, is_cancelled, ventana
 * de horas) lo hace el código bajo prueba, no el mock — así el test verifica
 * la lógica de runClassReminders, no la de Postgres.
 */
function createMockSupabase(candidateRows: Record<string, unknown>[]) {
  const claimedKeys = new Set<string>();
  const claimCalls: Array<Record<string, unknown>> = [];
  const completeCalls: Array<Record<string, unknown>> = [];
  let idCounter = 0;

  const client = {
    from(table: string) {
      if (table !== "reservations") {
        throw new Error(`from() no mockeado para tabla: ${table}`);
      }
      return {
        select(_cols: string) {
          return {
            eq(_col: string, _val: unknown) {
              return {
                gte(_col2: string, _val2: unknown) {
                  return {
                    lte(_col3: string, _val3: unknown) {
                      return Promise.resolve({ data: candidateRows, error: null });
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
  };
}

function fakeSendEmailRecordatorio() {
  let calls = 0;
  return {
    fn: async () => {
      calls += 1;
      return { success: true };
    },
    getCalls: () => calls,
  };
}

const clase = (overrides: Partial<Record<string, unknown>> = {}) => ({
  title: "Cocina italiana",
  date: "2026-08-02",
  start_time: "10:00:00",
  end_time: "12:00:00",
  is_cancelled: false,
  ...overrides,
});

const reserva = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: "res-1",
  class_id: "class-1",
  customer_name: "Ana",
  customer_email: "ana@example.com",
  spots: 2,
  classes: clase(),
  ...overrides,
});

// Clase el 2026-08-02 10:00 BA = 2026-08-02T13:00:00Z.
const NOW_DENTRO_DE_VENTANA = new Date("2026-08-01T13:00:00.000Z"); // 24h antes exacto
const NOW_MUY_LEJOS = new Date("2026-07-20T13:00:00.000Z");

test("reserva confirmada dentro de la ventana: se envía y se cuenta", async () => {
  const { client } = createMockSupabase([reserva()]);
  const sendEmail = fakeSendEmailRecordatorio();

  const metrics = await runClassReminders(client, NOW_DENTRO_DE_VENTANA, {
    sendEmailRecordatorio: sendEmail.fn,
  });

  assert.equal(metrics.classesChecked, 1);
  assert.equal(metrics.reservationsFound, 1);
  assert.equal(metrics.sent, 1);
  assert.equal(metrics.skipped, 0);
  assert.equal(metrics.failed, 0);
  assert.equal(sendEmail.getCalls(), 1);
});

test("clase fuera de la ventana de 23-25h: no se envía ni se cuenta como encontrada", async () => {
  const { client } = createMockSupabase([reserva()]);
  const sendEmail = fakeSendEmailRecordatorio();

  const metrics = await runClassReminders(client, NOW_MUY_LEJOS, {
    sendEmailRecordatorio: sendEmail.fn,
  });

  assert.equal(metrics.reservationsFound, 0);
  assert.equal(metrics.sent, 0);
  assert.equal(sendEmail.getCalls(), 0);
});

test("clase cancelada dentro de la ventana: se excluye aunque el horario matchee", async () => {
  const { client } = createMockSupabase([
    reserva({ classes: clase({ is_cancelled: true }) }),
  ]);
  const sendEmail = fakeSendEmailRecordatorio();

  const metrics = await runClassReminders(client, NOW_DENTRO_DE_VENTANA, {
    sendEmailRecordatorio: sendEmail.fn,
  });

  assert.equal(metrics.classesChecked, 0);
  assert.equal(metrics.reservationsFound, 0);
  assert.equal(sendEmail.getCalls(), 0);
});

test("dos corridas seguidas de la misma reserva/horario: la segunda no reenvía (dedup)", async () => {
  const { client } = createMockSupabase([reserva()]);
  const sendEmail = fakeSendEmailRecordatorio();
  const deps = { sendEmailRecordatorio: sendEmail.fn };

  const primera = await runClassReminders(client, NOW_DENTRO_DE_VENTANA, deps);
  const segunda = await runClassReminders(client, NOW_DENTRO_DE_VENTANA, deps);

  assert.equal(primera.sent, 1);
  assert.equal(segunda.sent, 0);
  assert.equal(segunda.skipped, 1);
  assert.equal(sendEmail.getCalls(), 1, "el email real solo se manda una vez");
});

test("reprogramar la clase a otro horario (misma fecha) genera un nuevo envío, no un dedup", async () => {
  const sendEmail = fakeSendEmailRecordatorio();
  const deps = { sendEmailRecordatorio: sendEmail.fn };

  // Misma reserva/clase, pero el mock se recrea porque cambia la fila
  // "vigente" que devolvería la clase reprogramada.
  const mockOriginal = createMockSupabase([reserva()]);
  const primera = await runClassReminders(mockOriginal.client, NOW_DENTRO_DE_VENTANA, deps);

  // Ahora el horario de la clase cambió (mismo día, otra hora), pero sigue
  // cayendo dentro de la ventana respecto de un `now` distinto.
  const nuevaHoraLocal = "14:00:00"; // 2026-08-02T17:00:00Z
  const nowParaNuevoHorario = new Date("2026-08-01T17:00:00.000Z"); // 24h antes
  const mockReprogramada = createMockSupabase([
    reserva({ classes: clase({ start_time: nuevaHoraLocal }) }),
  ]);
  const segunda = await runClassReminders(mockReprogramada.client, nowParaNuevoHorario, deps);

  assert.equal(primera.sent, 1);
  assert.equal(segunda.sent, 1, "la reprogramación es un evento nuevo, no un dedup del horario viejo");
  assert.equal(sendEmail.getCalls(), 2);
});

test("dos reservas activas en la misma clase: classesChecked cuenta clases únicas, no reservas", async () => {
  const { client } = createMockSupabase([
    reserva({ id: "res-1", customer_email: "a@example.com" }),
    reserva({ id: "res-2", customer_email: "b@example.com" }),
  ]);
  const sendEmail = fakeSendEmailRecordatorio();

  const metrics = await runClassReminders(client, NOW_DENTRO_DE_VENTANA, {
    sendEmailRecordatorio: sendEmail.fn,
  });

  assert.equal(metrics.classesChecked, 1);
  assert.equal(metrics.reservationsFound, 2);
  assert.equal(metrics.sent, 2);
});

test("fila con clase null (JOIN vacío) se ignora sin romper", async () => {
  const { client } = createMockSupabase([reserva({ classes: null })]);
  const sendEmail = fakeSendEmailRecordatorio();

  const metrics = await runClassReminders(client, NOW_DENTRO_DE_VENTANA, {
    sendEmailRecordatorio: sendEmail.fn,
  });

  assert.equal(metrics.classesChecked, 0);
  assert.equal(metrics.reservationsFound, 0);
  assert.equal(sendEmail.getCalls(), 0);
});
