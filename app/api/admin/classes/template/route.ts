import { NextResponse } from "next/server";
import { getCurrentUserEmail } from "@/lib/supabase/auth-server";
import { isAdminEmail } from "@/lib/admin/config";
import { getTemplateBySlug } from "@/lib/admin/clases-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/classes/template?slug=X
 * Devuelve la última plantilla de un slug (para autocompletar el form).
 */
export async function GET(req: Request) {
  const email = await getCurrentUserEmail();
  if (!email || !isAdminEmail(email)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "missing_slug" }, { status: 400 });
  }

  const template = await getTemplateBySlug(slug);
  if (!template) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ template });
}