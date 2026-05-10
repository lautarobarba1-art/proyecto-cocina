import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getCurrentUserEmail } from "@/lib/supabase/auth-server";
import { isAdminEmail } from "@/lib/admin/config";
import {
  validateClaseForm,
  type ClaseFormData,
} from "@/lib/admin/clases-validation";

export const runtime = "nodejs";

/**
 * POST /api/admin/classes
 * Body: ClaseFormData
 * Crea una clase nueva.
 */
export async function POST(req: Request) {
  const email = await getCurrentUserEmail();
  if (!email || !isAdminEmail(email)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const data = body as Partial<ClaseFormData>;

  const { ok, errors } = validateClaseForm(data);
  if (!ok) {
    return NextResponse.json(
      { error: "validation_failed", fieldErrors: errors },
      { status: 400 },
    );
  }

  const v = data as ClaseFormData;
  const supabase = getSupabaseAdmin();

  const { data: inserted, error } = await supabase
    .from("classes")
    .insert({
      slug: v.slug,
      date: v.date,
      title: v.title,
      start_time: v.startTime,
      end_time: v.endTime,
      category_event: v.categoryEvent,
      short_desc: v.shortDesc,
      is_highlighted: v.isHighlighted,
      category_label: v.categoryLabel,
      description_long: v.descriptionLong,
      duration_label: v.durationLabel,
      image_src: v.imageSrc,
      image_alt: v.imageAlt,
      total_spots: v.totalSpots,
      price: v.price,
      payment_link: v.paymentLink,
      is_cancelled: false,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "duplicate_slug_date" },
        { status: 409 },
      );
    }
    console.error("[POST /api/admin/classes]", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  if (!inserted) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: inserted.id });
}
