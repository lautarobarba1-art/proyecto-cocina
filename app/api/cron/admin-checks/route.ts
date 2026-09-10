import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { runAdminDigest } from "@/lib/notifications/admin-digest-dispatch";
import { runLowOccupancyChecks } from "@/lib/notifications/low-occupancy-dispatch";
import { isValidCronRequest } from "@/lib/cron/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/cron/admin-checks
 * Authorization: Bearer <CRON_SECRET>
 *
 * Mismo patrón que los otros crons (pg_cron/pg_net cada hora). Hace dos cosas:
 *   - runLowOccupancyChecks: cada corrida, mira las clases que son en 4 días.
 *   - runAdminDigest: se auto-filtra a las 8:00 hora de Argentina; el resto de
 *     las corridas del día son no-ops.
 * Toda la deduplicación vive en notification_log, así que es seguro invocarlo
 * de más. No devuelve datos personales — solo métricas agregadas.
 *
 * `ADMIN_CHECKS_ENABLED`: en cualquier valor distinto de "true" responde 200
 * sin tocar la base.
 */
export async function GET(req: Request) {
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) {
    console.error("[cron/admin-checks] Falta CRON_SECRET en variables de entorno");
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  if (!isValidCronRequest(req.headers.get("authorization"), expectedSecret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (process.env.ADMIN_CHECKS_ENABLED !== "true") {
    return NextResponse.json({ enabled: false });
  }

  try {
    const supabase = getSupabaseAdmin();
    const [digest, lowOccupancy] = await Promise.all([
      runAdminDigest(supabase),
      runLowOccupancyChecks(supabase),
    ]);
    return NextResponse.json({ digest, lowOccupancy });
  } catch (error) {
    console.error("[cron/admin-checks]", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
