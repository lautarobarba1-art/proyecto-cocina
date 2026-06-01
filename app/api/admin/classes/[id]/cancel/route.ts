import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getCurrentUserEmail } from "@/lib/supabase/auth-server";
import { isAdminEmail } from "@/lib/admin/config";
import { sendEmailReservaCancelada } from "@/lib/resend/send";

export const runtime = "nodejs";

/**
 * Forma en que la RPC `cancel_class_atomic` retorna los datos de los clientes
 * afectados (una fila por reserva cancelada).
 */
interface AffectedReservation {
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
  // Promise.allSettled garantiza que todos los envíos se intentan aunque alguno falle.
  const emailResults = await Promise.allSettled(
    affected.map((r) =>
      sendEmailReservaCancelada(r.customer_email, r.customer_name, r.class_title),
    ),
  );

  const emailsSent = emailResults.filter(
    (r) => r.status === "fulfilled" && r.value.success,
  ).length;
  const emailsFailed = affected.length - emailsSent;

  if (emailsFailed > 0) {
    console.error(
      `[admin/classes cancel] ${emailsFailed} email(s) failed for class ${id}`,
      emailResults
        .filter((r) => r.status === "rejected" || (r.status === "fulfilled" && !r.value.success))
        .map((r) => (r.status === "rejected" ? r.reason : (r as PromiseFulfilledResult<{ success: boolean; error?: string }>).value.error)),
    );
  }

  return NextResponse.json({
    ok: true,
    cancelledReservations: affected.length,
    emailsSent,
    emailsFailed,
  });
}
