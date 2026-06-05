import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("classes_with_availability")
      .select("id, title, date, spots_left, price")
      .eq("is_cancelled", false)
      .neq("category_event", "eventos")
      .gte("date", today)
      .gt("spots_left", 0)
      .order("date", { ascending: true })
      .limit(3);

    if (error) {
      console.error("[GET /api/classes/upcoming]", error);
      return NextResponse.json({ classes: [] }, { status: 500 });
    }

    return NextResponse.json({
      classes: (data ?? []).map((row) => ({
        id: row.id,
        titulo: row.title,
        fecha: row.date,
        cupos_disponibles: row.spots_left,
        precio: typeof row.price === "string" ? parseFloat(row.price) : row.price,
      })),
    });
  } catch (error) {
    console.error("[GET /api/classes/upcoming]", error);
    return NextResponse.json({ classes: [] }, { status: 500 });
  }
}
