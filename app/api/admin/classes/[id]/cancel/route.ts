import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getCurrentUserEmail } from "@/lib/supabase/auth-server";
import { isAdminEmail } from "@/lib/admin/config";

export const runtime = "nodejs";

/**
 * POST /api/admin/classes/[id]/cancel
 *
 * Cancela una clase. Comportamiento:
 *  1. Marca classes.is_cancelled = true.
 *  2. Cancela TODAS las reservas asociadas (pending + confirmed) →
 *     status = 'cancelled', cancelled_at = now().
 *
 * El cupo no necesita "liberarse" explícitamente porque la vista
 * classes_with_availability ya excluye las canceladas.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // 1. Auth
  const email = await getCurrentUserEmail();
  if (!email || !isAdminEmail(email)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // 2. Marcar la clase como cancelada
  const { data: classData, error: classError } = await supabase
    .from("classes")
    .update({ is_cancelled: true })
    .eq("id", id)
    .eq("is_cancelled", false) // no re-cancelar
    .select("id, slug, date")
    .maybeSingle();

  if (classError) {
    console.error("[admin/classes cancel - class]", classError);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
  if (!classData) {
    return NextResponse.json(
      { error: "already_cancelled_or_not_found" },
      { status: 409 },
    );
  }

  // 3. Cancelar todas las reservas activas asociadas
  const nowIso = new Date().toISOString();
  const { data: cancelledReservations, error: resError } = await supabase
    .from("reservations")
    .update({
      status: "cancelled",
      cancelled_at: nowIso,
    })
    .eq("class_id", id)
    .in("status", ["pending", "confirmed"])
    .select("id");

  if (resError) {
    // La clase ya quedó cancelada — esto es problemático pero no rompemos.
    // Podríamos hacer rollback manual pero por simpleza solo logueamos.
    console.error("[admin/classes cancel - reservations]", resError);
    return NextResponse.json(
      {
        ok: true,
        warning: "class_cancelled_but_reservations_failed",
        cancelledReservations: 0,
      },
      { status: 200 },
    );
  }

  return NextResponse.json({
    ok: true,
    cancelledReservations: cancelledReservations?.length ?? 0,
  });
}