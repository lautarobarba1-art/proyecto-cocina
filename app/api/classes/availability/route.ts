import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/classes/availability?slug=X&date=YYYY-MM-DD
 * Devuelve cupos disponibles + estado en tiempo real.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const date = searchParams.get("date");

  if (!slug || !date) {
    return NextResponse.json(
      { error: "missing_params" },
      { status: 400 },
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("classes_with_availability")
    .select("id, total_spots, spots_left, is_cancelled")
    .eq("slug", slug)
    .eq("date", date)
    .maybeSingle();

  if (error) {
    console.error("[GET /api/classes/availability]", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    classId: data.id,
    totalSpots: data.total_spots,
    spotsLeft: data.spots_left,
    isCancelled: data.is_cancelled,
  });
}