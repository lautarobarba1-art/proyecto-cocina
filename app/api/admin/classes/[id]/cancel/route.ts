import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getCurrentUserEmail } from "@/lib/supabase/auth-server";
import { isAdminEmail } from "@/lib/admin/config";
import { notifyReservationCancelled } from "@/lib/notifications/notify";

export const runtime = "nodejs";

/**
 * Forma en que la RPC `cancel_class_atomic` retorna los datos de los clientes
 * afectados (una fila por reserva cancelada). `reservation_id` se agregó en la
 * migración 20260910000001 para poder rutear el aviso por el pipeline de
 * notificaciones (necesita el id para la dedup key).
 */
interface AffectedReservation {
  reservation_id: string;
  customer_name: string;
  customer_email: string;
  class_title: string;
  class_date: string;
  class_start_time: string;
}

/**
 * POST /api/admin/classes/[id]/cancel
 *
 * Cancela una clase de forma ATÓMICA:
 *   1. Llama a la RPC `cancel_class_atomic` que, en una sola transacción:
 *      a) Marca classes.is_cancelled = true.
 *      b) Cancela todas las reservas pending/confirmed asociadas.
 *      c) Retorna los datos de los clientes afectados.
 *   2. Envía emails de notificación a cada cliente afectado (fuera de la TX).
 *      Los fallos de email son best-effort: se loguean pero no revierten la DB.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const email = await getCurrentUserEmail();
  if (!email || !isAdminEmail(email)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }

  // ── Cancelación atómica vía RPC ───────────────────────────────────────────
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.rpc("cancel_class_atomic", {
    p_class_id: id,
  });

  if (error) {
    if (error.message?.includes("not_found")) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (error.message?.includes("already_cancelled")) {
      return NextResponse.json(
        { error: "already_cancelled_or_not_found" },
        { status: 409 },
      );
    }
    console.error("[admin/classes cancel]", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  const affected = (data ?? []) as AffectedReservation[];

  // ── Notificación por email (best-effort, fuera de la TX) ─────────────────
  // Por el pipeline de notificaciones: cada aviso queda en notification_log y
  // el cron de reintentos recupera los que fallen. Promise.allSettled garantiza
  // que todos se intentan aunque alguno falle.
  const emailResults = await Promise.allSettled(
    affected.map((r) =>
      notifyReservationCancelled(supabase, {
        reservationId: r.reservation_id,
        classId: id,
        customerName: r.customer_name,
        customerEmail: r.customer_email,
        className: r.class_title,
      }),
    ),
  );

  const emailsSent = emailResults.filter(
    (r) => r.status === "fulfilled" && r.value.email.outcome === "sent",
  ).length;
  // "not_claimed" = ya se había avisado antes (dedup) — no cuenta como fallo.
  const emailsFailed = emailResults.filter(
    (r) =>
      r.status === "rejected" ||
      (r.status === "fulfilled" && r.value.email.outcome === "failed"),
  ).length;

  if (emailsFailed > 0) {
    console.error(
      `[admin/classes cancel] ${emailsFailed} aviso(s) fallaron para la clase ${id} (quedan en notification_log para reintento)`,
    );
  }

  return NextResponse.json({
    ok: true,
    cancelledReservations: affected.length,
    emailsSent,
    emailsFailed,
  });
}
