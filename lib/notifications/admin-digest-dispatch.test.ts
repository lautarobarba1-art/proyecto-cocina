import { test } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  runAdminDigest,
  type AdminDigestDeps,
  type DigestData,
} from "./admin-digest-dispatch.ts";

function createMockSupabase() {
  const claimedKeys = new Set<string>();
  const claimCalls: Array<Record<string, unknown>> = [];
  let idCounter = 0;

  const client = {
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

// 2026-09-10T11:00Z == 08:00 en Argentina (UTC-3)
const NOW_8AM_AR = new Date("2026-09-10T11:00:00.000Z");
const NOW_NOON_AR = new Date("2026-09-10T15:00:00.000Z");

const emptyData: DigestData = {
  comprobantesPendientes: 0,
  consultasNuevas: 0,
  fallasPermanentes: 0,
  proximasClases: [],
};

const deps = (
  data: Partial<DigestData> = {},
  over: Partial<AdminDigestDeps> = {},
): AdminDigestDeps => ({
  gather: async () => ({ ...emptyData, ...data }),
  sendEmailAdminDigest: async () => ({ success: true }),
  ...over,
});

test("fuera de las 8:00 AR no hace nada", async () => {
  const { client } = createMockSupabase();
  const res = await runAdminDigest(client, NOW_NOON_AR, deps());
  assert.equal(res.status, "skipped_hour");
});

test("8:00 AR sin nada pendiente: no manda el email", async () => {
  const { client } = createMockSupabase();
  const res = await runAdminDigest(client, NOW_8AM_AR, deps());
  assert.equal(res.status, "skipped_empty");
});

test("8:00 AR con comprobantes pendientes: manda el resumen con dedup key por fecha", async (t) => {
  const original = process.env.ADMIN_EMAIL;
  process.env.ADMIN_EMAIL = "admin@example.com";
  t.after(() => { process.env.ADMIN_EMAIL = original; });

  let sends = 0;
  const { client, claimCalls } = createMockSupabase();
  const res = await runAdminDigest(
    client,
    NOW_8AM_AR,
    deps(
      { comprobantesPendientes: 3 },
      { sendEmailAdminDigest: async () => { sends += 1; return { success: true }; } },
    ),
  );

  assert.equal(res.status, "sent");
  assert.equal(sends, 1);
  assert.equal(claimCalls[0].p_deduplication_key, "resumen_admin:2026-09-10");
  assert.equal(claimCalls[0].p_event_type, "resumen_admin");
});

test("8:00 AR con solo clases próximas también dispara", async (t) => {
  const original = process.env.ADMIN_EMAIL;
  process.env.ADMIN_EMAIL = "admin@example.com";
  t.after(() => { process.env.ADMIN_EMAIL = original; });

  const { client } = createMockSupabase();
  const res = await runAdminDigest(
    client,
    NOW_8AM_AR,
    deps({
      proximasClases: [
        {
          title: "Cocina italiana",
          dateLabel: "sábado 13 de septiembre",
          spotsLeft: 6,
          totalSpots: 10,
          statusLabel: "Disponible",
          isEvento: false,
        },
      ],
    }),
  );
  assert.equal(res.status, "sent");
});

test("dos corridas el mismo día: la segunda no reenvía (dedup por fecha)", async (t) => {
  const original = process.env.ADMIN_EMAIL;
  process.env.ADMIN_EMAIL = "admin@example.com";
  t.after(() => { process.env.ADMIN_EMAIL = original; });

  const { client } = createMockSupabase();
  const d = deps({ consultasNuevas: 2 });

  const first = await runAdminDigest(client, NOW_8AM_AR, d);
  const second = await runAdminDigest(client, NOW_8AM_AR, d);

  assert.equal(first.status, "sent");
  assert.equal(second.status, "not_claimed");
});
