import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getCurrentUserEmail } from "@/lib/supabase/auth-server";
import { isAdminEmail } from "@/lib/admin/config";
import { confirmReservationPayment } from "@/lib/admin/reservas-actions";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // 1. Auth
  const email = await getCurrentUserEmail();
  if (!email || !isAdminEmail(email)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 2. Body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const action = (body as { action?: string })?.action;
  if (action !== "confirm" && action !== "cancel" && action !== "delete") {
    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  }

  // 3. ID
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // ─── DELETE ─────────────────────────────────────────────────────────────────
  // Borrado definitivo de reservas mal hechas (no envía email; para cancelaciones
  // legítimas de clientes usar "cancel", que sí notifica).
  if (action === "delete") {
    const { data: existing } = await supabase
      .from("reservations")
      .select("id, comprobante_url")
      .eq("id", id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    if (existing.comprobante_url) {
      const { error: storageError } = await supabase.storage
        .from("comprobantes")
        .remove([existing.comprobante_url]);
      if (storageError) {
        console.error("[admin/reservations delete] Storage cleanup error:", storageError);
      }
    }

    const { error: deleteError } = await supabase
      .from("reservations")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("[admin/reservations delete]", deleteError);
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  // ─── CONFIRM ────────────────────────────────────────────────────────────────
  // La transición real (anterior != confirmed -> nuevo = confirmed) y el
  // disparo de notifyPaymentConfirmed viven en confirmReservationPayment
  // (lib/admin/reservas-actions.ts), testeado ahí directamente sin necesitar
  // un Request/Response completo — ver lib/admin/reservas-actions.test.ts.
  if (action === "confirm") {
    const result = await confirmReservationPayment(supabase, id);

    if (!result.ok && result.reason === "db_error") {
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }
    if (!result.ok) {
      return NextResponse.json(
        { error: "not_pending_or_not_found" },
        { status: 409 },
      );
    }

    return NextResponse.json({ ok: true, status: result.status });
  }

  // ─── CANCEL ─────────────────────────────────────────────────────────────────
  const { data, error } = await supabase
    .from("reservations")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", id)
    .neq("status", "cancelled")
    .select("id, status, customer_name, customer_email, class_id")
    .maybeSingle();

  if (error) {
    console.error("[admin/reservations cancel]", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json(
      { error: "already_cancelled_or_not_found" },
      { status: 409 },
    );
  }

  // Email al cliente: reserva cancelada
  try {
    const { sendEmailReservaCancelada } = await import("@/lib/resend/send");

    const { data: cls } = await supabase
      .from("classes")
      .select("title")
      .eq("id", data.class_id)
      .maybeSingle();

    await sendEmailReservaCancelada(
      data.customer_email,
      data.customer_name,
      cls?.title ?? "(clase)",
    );
  } catch (emailErr) {
    console.error("[admin/reservations cancel] Email error:", emailErr);
  }

  return NextResponse.json({ ok: true, status: data.status });
}