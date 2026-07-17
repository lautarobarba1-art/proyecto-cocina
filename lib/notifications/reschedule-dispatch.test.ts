/* eslint-disable @typescript-eslint/no-unused-vars -- el mock replica la firma fluida de Supabase (.from().select().eq().in()); los parámetros existen solo para matchear esa forma, el mock no filtra por ellos */
import { test } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  hasScheduleChanged,
  notifyReservationsOfReschedule,
} from "./reschedule-dispatch.ts";

test("hasScheduleChanged: false cuando fecha y horario son iguales", () => {
  assert.equal(
    hasScheduleChanged(
      { date: "2026-08-01", startTime: "10:00:00", endTime: "12:00:00" },
      { date: "2026-08-01", startTime: "10:00", endTime: "12:00" },
    ),
    false,
    "HH:MM:SS vs HH:MM del mismo horario no debe contar como cambio",
  );
});

test("hasScheduleChanged: true si cambia la fecha", () => {
  assert.equal(
    hasScheduleChanged(
      { date: "2026-08-01", startTime: "10:00", endTime: "12:00" },
      { date: "2026-08-05", startTime: "10:00", endTime: "12:00" },
    ),
    true,
  );
});

test("hasScheduleChanged: true si cambia el horario de inicio o fin", () => {
  assert.equal(
    hasScheduleChanged(
      { date: "2026-08-01", startTime: "10:00:00", endTime: "12:00:00" },
      { date: "2026-08-01", startTime: "14:00", endTime: "12:00" },
    ),
    true,
  );
  assert.equal(
    hasScheduleChanged(
      { date: "2026-08-01", startTime: "10:00:00", endTime: "12:00:00" },
      { date: "2026-08-01", startTime: "10:00", endTime: "16:00" },
    ),
    true,
  );
});

function createMockSupabase(reservationRows: Record<string, unknown>[]) {
  const claimedKeys = new Set<string>();
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
                in(_col2: string, _vals: string[]) {
                  return Promise.resolve({ data: reservationRows, error: null });
                },
              };
            },
          };
        },
      };
    },
    async rpc(name: string, args: Record<string, unknown>) {
      if (name === "claim_notification_attempt") {
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
        return { data: true, error: null };
      }
      throw new Error(`RPC no mockeada: ${name}`);
    },
  };

  return { client: client as unknown as SupabaseClient };
}

const details = {
  oldDateISO: "2026-08-01",
  oldStartTime: "10:00:00",
  oldEndTime: "12:00:00",
  newDateISO: "2026-08-05",
  newStartTime: "10:00:00",
  newEndTime: "12:00:00",
};

test("notifica a todas las reservas activas de la clase reprogramada", async () => {
  const { client } = createMockSupabase([
    { id: "res-1", customer_name: "Ana", customer_email: "ana@example.com" },
    { id: "res-2", customer_name: "Bruno", customer_email: "bruno@example.com" },
  ]);
  let sends = 0;

  const result = await notifyReservationsOfReschedule(
    client,
    "class-1",
    "Cocina italiana",
    details,
    { sendEmailReprogramacion: async () => { sends += 1; return { success: true }; } },
  );

  assert.equal(result.notified, 2);
  assert.equal(result.failed, 0);
  assert.equal(sends, 2);
});

test("no rompe si no hay reservas activas para la clase", async () => {
  const { client } = createMockSupabase([]);

  const result = await notifyReservationsOfReschedule(client, "class-1", "Cocina italiana", details);

  assert.equal(result.notified, 0);
  assert.equal(result.skipped, 0);
  assert.equal(result.failed, 0);
});

test("una reserva ya notificada para la misma transición se cuenta como skipped, no reenvía", async () => {
  const { client } = createMockSupabase([
    { id: "res-1", customer_name: "Ana", customer_email: "ana@example.com" },
  ]);
  let sends = 0;
  const deps = { sendEmailReprogramacion: async () => { sends += 1; return { success: true }; } };

  const primera = await notifyReservationsOfReschedule(client, "class-1", "Cocina italiana", details, deps);
  const segunda = await notifyReservationsOfReschedule(client, "class-1", "Cocina italiana", details, deps);

  assert.equal(primera.notified, 1);
  assert.equal(segunda.notified, 0);
  assert.equal(segunda.skipped, 1);
  assert.equal(sends, 1);
});
