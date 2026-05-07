import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * POST /api/reservations
 * Body: {
 *   classId: string,
 *   name: string,
 *   email: string,
 *   phone?: string,
 *   notes?: string,
 *   spots: number,         // 1-4
 *   idempotencyKey: string, // uuid v4 generado en cliente
 *   honeypot?: string       // anti-bot: si viene con valor, rechazamos silencioso
 * }
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;

  // Honeypot: si tiene valor, simulamos éxito para no dar pista al bot
  if (typeof b.honeypot === "string" && b.honeypot.trim() !== "") {
    return NextResponse.json(
      { ok: true, reservationId: "00000000-0000-0000-0000-000000000000" },
      { status: 200 },
    );
  }

  // Validaciones manuales (sin zod por ahora, mantener deps mínimas)
  const classId = typeof b.classId === "string" ? b.classId.trim() : "";
  const name = typeof b.name === "string" ? b.name.trim() : "";
  const email = typeof b.email === "string" ? b.email.trim() : "";
  const phone = typeof b.phone === "string" ? b.phone.trim() : null;
  const notes = typeof b.notes === "string" ? b.notes.trim() : null;
  const spots = typeof b.spots === "number" ? Math.floor(b.spots) : NaN;
  const idempotencyKey =
    typeof b.idempotencyKey === "string" ? b.idempotencyKey.trim() : "";

  if (!classId || !name || !email || !idempotencyKey) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  if (!Number.isFinite(spots) || spots < 1 || spots > 4) {
    return NextResponse.json({ error: "invalid_spots" }, { status: 400 });
  }
  if (name.length > 200 || email.length > 320) {
    return NextResponse.json({ error: "fields_too_long" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc("create_reservation_atomic", {
    p_class_id: classId,
    p_customer_name: name,
    p_customer_email: email,
    p_customer_phone: phone,
    p_notes: notes,
    p_spots: spots,
    p_idempotency_key: idempotencyKey,
  });

  if (error) {
    console.error("[POST /api/reservations]", error);
    return NextResponse.json(
      { error: "server_error", detail: error.message },
      { status: 500 },
    );
  }

  // RPC devuelve un array con una fila
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  if (row.error_code === "no_spots") {
    return NextResponse.json({ error: "no_spots" }, { status: 409 });
  }
  if (row.error_code === "cancelled") {
    return NextResponse.json({ error: "cancelled" }, { status: 409 });
  }
  if (row.error_code === "class_not_found") {
    return NextResponse.json({ error: "class_not_found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      ok: true,
      reservationId: row.reservation_id,
      wasCreated: row.was_created,
    },
    { status: row.was_created ? 201 : 200 },
  );
}