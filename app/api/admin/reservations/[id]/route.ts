import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getCurrentUserEmail } from "@/lib/supabase/auth-server";
import { isAdminEmail } from "@/lib/admin/config";

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
  if (action !== "confirm" && action !== "cancel") {
    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  }

  // 3. ID
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // ─── CONFIRM ────────────────────────────────────────────────────────────────
  if (action === "confirm") {
    const { data, error } = await supabase
      .from("reservations")
      .update({
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("status", "pending")
      .select("id, status, customer_name, customer_email, class_id")
      .maybeSingle();

    if (error) {
      console.error("[admin/reservations confirm]", error);
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json(
        { error: "not_pending_or_not_found" },
        { status: 409 },
      );
    }

    // Email al cliente: pago confirmado
    try {
      const { sendEmailReservaConfirmada } = await import("@/lib/resend/send");

      // Traer nombre de la clase
      const { data: cls } = await supabase
        .from("classes")
        .select("title")
        .eq("id", data.class_id)
        .maybeSingle();

      await sendEmailReservaConfirmada(
        data.customer_email,
        data.customer_name,
        cls?.title ?? "(clase)",
      );
    } catch (emailErr) {
      console.error("[admin/reservations confirm] Email error:", emailErr);
    }

    return NextResponse.json({ ok: true, status: data.status });
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