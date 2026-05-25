import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getCurrentUserEmail } from "@/lib/supabase/auth-server";
import { isAdminEmail } from "@/lib/admin/config";

export const runtime = "nodejs";

/**
 * PATCH /api/admin/inquiries/[id]
 * Body: { status: "read" | "archived" }
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const status = (body as { status?: string })?.status;
  if (status !== "read" && status !== "archived" && status !== "new") {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const { id } = await params;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("inquiries")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("[PATCH /api/admin/inquiries]", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
