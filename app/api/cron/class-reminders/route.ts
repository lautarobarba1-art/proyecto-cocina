import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { runClassReminders } from "@/lib/notifications/reminder-dispatch";
import { isValidCronRequest } from "@/lib/cron/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/cron/class-reminders
 * Authorization: Bearer <CRON_SECRET>
 *
 * Pensado para ser invocado por un scheduler externo (pg_cron/pg_net o
 * Vercel Cron) una vez por hora. Es seguro invocarlo más veces de las
 * necesarias, más de una vez para la misma corrida, o en paralelo con otra
 * invocación superpuesta: toda la deduplicación real vive en
 * `notification_log` (ver runClassReminders / notifyClassReminder), no acá.
 *
 * No debe devolver ni loguear datos personales (nombre, email, teléfono) —
 * solo métricas agregadas.
 *
 * `REMINDERS_ENABLED` (feature flag, mismo patrón que WHATSAPP_ENABLED):
 * en cualquier valor distinto de "true" el endpoint responde 200 sin tocar
 * la base ni intentar ningún envío. Permite desplegar el cron ya conectado
 * al scheduler pero apagado, probarlo manualmente, y recién ahí encenderlo
 * sin necesitar un nuevo deploy.
 */
export async function GET(req: Request) {
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) {
    console.error("[cron/class-reminders] Falta CRON_SECRET en variables de entorno");
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  if (!isValidCronRequest(req.headers.get("authorization"), expectedSecret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (process.env.REMINDERS_ENABLED !== "true") {
    return NextResponse.json({ enabled: false });
  }

  try {
    const supabase = getSupabaseAdmin();
    const metrics = await runClassReminders(supabase);
    return NextResponse.json(metrics);
  } catch (error) {
    console.error("[cron/class-reminders]", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
