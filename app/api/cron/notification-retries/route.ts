import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { runNotificationRetries } from "@/lib/notifications/retry-dispatch";
import { isValidCronRequest } from "@/lib/cron/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/cron/notification-retries
 * Authorization: Bearer <CRON_SECRET>
 *
 * Mismo patrón que los otros crons (pg_cron/pg_net una vez por hora). Re-intenta
 * los envíos de `notification_log` que quedaron `failed` con `retryable=true` y
 * `next_retry_at` vencido. Toda la deduplicación y el backoff viven en
 * `notification_log` / `claim_notification_attempt` (ver runNotificationRetries),
 * así que es seguro invocarlo de más.
 *
 * No devuelve ni loguea datos personales — solo métricas agregadas.
 *
 * `NOTIFICATION_RETRIES_ENABLED`: en cualquier valor distinto de "true" responde
 * 200 sin tocar la base. Permite deployar el cron ya conectado pero apagado.
 */
export async function GET(req: Request) {
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) {
    console.error("[cron/notification-retries] Falta CRON_SECRET en variables de entorno");
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  if (!isValidCronRequest(req.headers.get("authorization"), expectedSecret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (process.env.NOTIFICATION_RETRIES_ENABLED !== "true") {
    return NextResponse.json({ enabled: false });
  }

  try {
    const supabase = getSupabaseAdmin();
    const metrics = await runNotificationRetries(supabase);
    return NextResponse.json(metrics);
  } catch (error) {
    console.error("[cron/notification-retries]", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
