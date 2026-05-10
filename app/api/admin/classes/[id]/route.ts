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
 * PATCH /api/admin/classes/[id]
 * Body: ClaseFormData (todos los campos)
 * Actualiza una clase existente.
 */
export async function PATCH(
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

  const { data: updated, error } = await supabase
    .from("classes")
    .update({
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
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "duplicate_slug_date" },
        { status: 409 },
      );
    }
    console.error("[PATCH /api/admin/classes]", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  if (!updated) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}