import { NextResponse } from "next/server";

import {
  isHoneypotSubmission,
  validateInquiryBody,
  type InquiryValidationError,
} from "@/lib/inquiries/validate";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ERROR_STATUS: Record<InquiryValidationError, number> = {
  invalid_json: 400,
  invalid_body: 400,
  invalid_type: 400,
  missing_fields: 400,
  invalid_email: 400,
  fields_too_long: 400,
  invalid_mensaje: 400,
  invalid_fecha: 400,
};

/**
 * POST /api/inquiries
 * Body: {
 *   type: "contact" | "espacio",
 *   name: string,
 *   email: string,
 *   mensaje: string,
 *   marca?: string,   // espacio
 *   fecha?: string,   // espacio YYYY-MM-DD
 *   honeypot?: string
 * }
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const result = validateInquiryBody(body);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: ERROR_STATUS[result.error] },
    );
  }

  if (isHoneypotSubmission(result.data)) {
    return NextResponse.json({ ok: true, inquiryId: "00000000-0000-0000-0000-000000000000" });
  }

  const { type, name, email, payload } = result.data;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("inquiries")
    .insert({
      type,
      customer_name: name,
      customer_email: email,
      payload,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[POST /api/inquiries]", error);
    return NextResponse.json(
      { error: "server_error", detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, inquiryId: data.id }, { status: 201 });
}
