import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getCurrentUserEmail } from "@/lib/supabase/auth-server";
import { isAdminEmail } from "@/lib/admin/config";

export const runtime = "nodejs";

/**
 * POST /api/admin/reservations/[id]
 * Body: { action: "confirm" | "cancel" }
 *
 * Acciones del admin sobre una reserva específica.
 * Requiere sesión admin válida (allowlist).
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // 1. Verificar que sea admin autorizado
  const email = await getCurrentUserEmail();
  if (!email || !isAdminEmail(email)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 2. Parsear body
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

  // 3. Obtener id de la reserva
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }

  // 4. Ejecutar la acción
  const supabase = getSupabaseAdmin();

  if (action === "confirm") {
    const { data, error } = await supabase
      .from("reservations")
      .update({
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("status", "pending") // solo si está pending
      .select("id, status")
      .maybeSingle();

    if (error) {
      console.error("[admin/reservations confirm]", error);
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }
    if (!data) {
      // No se actualizó: la reserva no existe o no estaba en pending
      return NextResponse.json(
        { error: "not_pending_or_not_found" },
        { status: 409 },
      );
    }

    return NextResponse.json({ ok: true, status: data.status });
  }

  // action === "cancel"
  const { data, error } = await supabase
    .from("reservations")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", id)
    .neq("status", "cancelled") // no cancelar lo ya cancelado
    .select("id, status")
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

  return NextResponse.json({ ok: true, status: data.status });
}