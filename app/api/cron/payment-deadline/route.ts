import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { runPaymentDeadlineChecks } from "@/lib/notifications/payment-deadline-dispatch";
import { isValidCronRequest } from "@/lib/cron/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/cron/payment-deadline
 * Authorization: Bearer <CRON_SECRET>
 *
 * Mismo patrón que /api/cron/class-reminders: pensado para un scheduler
 * externo (pg_cron/pg_net) una vez por hora. Seguro de invocar más veces de
 * las necesarias — toda la deduplicación real vive en `notification_log` y
 * en el `.eq("status","pending")` del UPDATE de cancelación (ver
 * runPaymentDeadlineChecks), no acá.
 *
 * `PAYMENT_DEADLINE_ENABLED`: en cualquier valor distinto de "true" el
 * endpoint responde 200 sin tocar la base ni cancelar nada. Permite
 * desplegar el cron ya conectado al scheduler pero apagado, probarlo a mano,
 * y recién ahí encenderlo sin un nuevo deploy.
 */
export async function GET(req: Request) {
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) {
    console.error("[cron/payment-deadline] Falta CRON_SECRET en variables de entorno");
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  if (!isValidCronRequest(req.headers.get("authorization"), expectedSecret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (process.env.PAYMENT_DEADLINE_ENABLED !== "true") {
    return NextResponse.json({ enabled: false });
  }

  try {
    const supabase = getSupabaseAdmin();
    const metrics = await runPaymentDeadlineChecks(supabase);
    return NextResponse.json(metrics);
  } catch (error) {
    console.error("[cron/payment-deadline]", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
