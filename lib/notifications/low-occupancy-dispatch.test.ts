/* eslint-disable @typescript-eslint/no-unused-vars -- el mock replica la firma fluida de Supabase */
import { test } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";

import { runLowOccupancyChecks } from "./low-occupancy-dispatch.ts";

function createMockSupabase(classRows: Record<string, unknown>[]) {
  const claimedKeys = new Set<string>();
  const claimCalls: Array<Record<string, unknown>> = [];
  let idCounter = 0;

  const client = {
    from(table: string) {
      if (table !== "classes_with_availability") {
        throw new Error(`from() no mockeado: ${table}`);
      }
      const b = {
        select: (_c: string) => b,
        eq: (_c: string, _v: unknown) => b,
        in: (_c: string, _v: unknown) =>
          Promise.resolve({ data: classRows, error: null }),
      };
      return b;
    },
    async rpc(name: string, args: Record<string, unknown>) {
      if (name === "claim_notification_attempt") {
        claimCalls.push(args);
        const key = `${args.p_channel}:${args.p_delivery_mode}:${args.p_deduplication_key}`;
        if (claimedKeys.has(key)) {
          return { data: [{ id: `r-${idCounter}`, claim_token: null, attempt_count: 1, claimed: false }], error: null };
        }
        claimedKeys.add(key);
        idCounter += 1;
        return { data: [{ id: `r-${idCounter}`, claim_token: `t-${idCounter}`, attempt_count: 1, claimed: true }], error: null };
      }
      if (name === "complete_notification_attempt") return { data: true, error: null };
      throw new Error(`RPC no mockeada: ${name}`);
    },
  };

  return { client: client as unknown as SupabaseClient, claimCalls };
}

const NOW = new Date("2026-09-10T15:00:00.000Z");

const claseRow = (over: Record<string, unknown> = {}) => ({
  id: "class-1",
  title: "Cocina italiana",
  date: "2026-09-14", // NOW + 4 días en AR
  total_spots: 10,
  spots_left: 8, // 20% ocupado -> por debajo del 40%
  category_event: "adultos",
  is_cancelled: false,
  ...over,
});

const okDeps = () => {
  let sends = 0;
  return {
    deps: {
      sendEmailAdminLowOccupancy: async () => {
        sends += 1;
        return { success: true as const };
      },
    },
    getSends: () => sends,
  };
};

test("avisa de una clase en 4 días con menos del 40% de cupos ocupados", async (t) => {
  const original = process.env.ADMIN_EMAIL;
  process.env.ADMIN_EMAIL = "admin@example.com";
  t.after(() => { process.env.ADMIN_EMAIL = original; });

  const { client, claimCalls } = createMockSupabase([claseRow()]);
  const s = okDeps();

  const metrics = await runLowOccupancyChecks(client, NOW, s.deps);

  assert.equal(metrics.checked, 1);
  assert.equal(metrics.alertsSent, 1);
  assert.equal(s.getSends(), 1);
  assert.equal(claimCalls[0].p_deduplication_key, "baja_ocupacion:class-1");
});

test("no avisa si la clase ya tiene 40% o más de ocupación", async (t) => {
  const original = process.env.ADMIN_EMAIL;
  process.env.ADMIN_EMAIL = "admin@example.com";
  t.after(() => { process.env.ADMIN_EMAIL = original; });

  const { client } = createMockSupabase([claseRow({ spots_left: 6 })]); // 40% justo
  const s = okDeps();

  const metrics = await runLowOccupancyChecks(client, NOW, s.deps);

  assert.equal(metrics.checked, 1);
  assert.equal(metrics.alertsSent, 0);
  assert.equal(s.getSends(), 0);
});

test("dos corridas del mismo día: la segunda no reenvía (dedup por clase)", async (t) => {
  const original = process.env.ADMIN_EMAIL;
  process.env.ADMIN_EMAIL = "admin@example.com";
  t.after(() => { process.env.ADMIN_EMAIL = original; });

  const { client } = createMockSupabase([claseRow()]);
  const s = okDeps();

  const first = await runLowOccupancyChecks(client, NOW, s.deps);
  const second = await runLowOccupancyChecks(client, NOW, s.deps);

  assert.equal(first.alertsSent, 1);
  assert.equal(second.alertsSent, 0);
  assert.equal(second.alertsSkipped, 1);
  assert.equal(s.getSends(), 1);
});

test("una clase con total_spots 0 se ignora sin romper", async () => {
  const { client } = createMockSupabase([claseRow({ total_spots: 0, spots_left: 0 })]);
  const s = okDeps();

  const metrics = await runLowOccupancyChecks(client, NOW, s.deps);

  assert.equal(metrics.alertsSent, 0);
  assert.equal(s.getSends(), 0);
});
