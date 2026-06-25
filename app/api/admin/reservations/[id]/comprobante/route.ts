import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getCurrentUserEmail } from "@/lib/supabase/auth-server";
import { isAdminEmail } from "@/lib/admin/config";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const email = await getCurrentUserEmail();
  if (!email || !isAdminEmail(email)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: reservation } = await supabase
    .from("reservations")
    .select("comprobante_url")
    .eq("id", id)
    .maybeSingle();

  if (!reservation?.comprobante_url) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: signedData, error } = await supabase.storage
    .from("comprobantes")
    .createSignedUrl(reservation.comprobante_url, 300);

  if (error || !signedData?.signedUrl) {
    console.error("[GET /api/admin/reservations/[id]/comprobante]", error);
    return NextResponse.json({ error: "storage_error" }, { status: 500 });
  }

  return NextResponse.redirect(signedData.signedUrl);
}
