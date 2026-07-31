import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { checkReservationsLimit, getIp } from "@/lib/ratelimit";
import { notifyReservationConfirmed } from "@/lib/notifications/notify";

export async function POST(req: Request) {
  const rl = await checkReservationsLimit(getIp(req));
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "too_many_requests" },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfter) },
      },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;

  // Normalizar nombres de campos (el form manda name/email/phone, el endpoint espera customerName/customerEmail/customerPhone)
  const classId = payload.classId as string;
  const spots = parseInt(String(payload.spots ?? 1), 10);
  const customerName = (payload.name ?? payload.customerName) as string;
  const customerEmail = (payload.email ?? payload.customerEmail) as string;
  const customerPhone = (payload.phone ?? payload.customerPhone) as string | null;
  const notes = (payload.notes ?? payload.messages) as string | null;
  const honeypot = (payload.honeypot ?? "") as string;

  // Validar honeypot
  if (honeypot) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // Validar campos requeridos
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (
    !classId ||
    !UUID_RE.test(classId) ||
    !spots ||
    spots < 1 ||
    spots > 15 ||
    !customerName ||
    !customerEmail ||
    !EMAIL_RE.test(customerEmail)
  ) {
    return NextResponse.json(
      { error: "missing_or_invalid_fields" },
      { status: 400 },
    );
  }

  if (customerName.length > 120) {
    return NextResponse.json({ error: "missing_or_invalid_fields" }, { status: 400 });
  }
  if (notes && notes.length > 1000) {
    return NextResponse.json({ error: "missing_or_invalid_fields" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: classRow } = await supabase
    .from("classes")
    .select("category_event")
    .eq("id", classId)
    .maybeSingle();

  if (classRow?.category_event === "eventos") {
    return NextResponse.json(
      { error: "private_event_not_bookable" },
      { status: 403 },
    );
  }

  // Crear la reserva en una única transacción.
  const { data, error } = await supabase.rpc("create_reservation_atomic", {
    p_class_id: classId,
    p_customer_email: customerEmail,
    p_customer_name: customerName,
    p_customer_phone: customerPhone ?? null,
    p_idempotency_key: payload.idempotencyKey as string,
    p_notes: notes ?? null,
    p_spots: spots,
  });

  if (error) {
    console.error("[POST /api/reservations] RPC error:", error);

    if (error.message.includes("cancelled")) {
      return NextResponse.json({ error: "cancelled" }, { status: 409 });
    }
    if (error.message.includes("not_available")) {
      return NextResponse.json({ error: "not_available" }, { status: 409 });
    }
    if (error.message.includes("duplicate")) {
      return NextResponse.json({ error: "duplicate" }, { status: 409 });
    }
    // Unique constraint violation: race condition en idempotency key — la reserva ya existe
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "duplicate" }, { status: 409 });
    }
    // Check constraint violation (ej. reservations_spots_check): la API valida
    // spots <= 15 arriba, pero si el constraint de DB queda desalineado de
    // nuevo en el futuro, esto evita un 500 genérico sin motivo claro.
    if ((error as { code?: string }).code === "23514") {
      return NextResponse.json({ error: "invalid_spots" }, { status: 400 });
    }

    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json(
      { error: "unknown_error" },
      { status: 500 },
    );
  }

  const created = data[0];
  const reservationId = created.reservation_id;

  // Obtener datos de la clase para las notificaciones
  const { data: cls } = await supabase
    .from("classes")
    .select("title, date, start_time, end_time, deposit_amount")
    .eq("id", classId)
    .maybeSingle();

  // ============================================
  // 📧 Notificar por email (con timeout interno; nunca revierte la reserva)
  // ============================================
  try {
    await notifyReservationConfirmed(supabase, {
      reservationId,
      classId,
      customerName,
      customerEmail,
      className: cls?.title ?? "(clase)",
      classDateISO: cls?.date ?? "",
      classStartTime: cls?.start_time ?? "",
      classEndTime: cls?.end_time ?? "",
      spots,
      depositAmount:
        cls?.deposit_amount != null
          ? (typeof cls.deposit_amount === "string"
              ? parseFloat(cls.deposit_amount)
              : cls.deposit_amount) * spots
          : null,
      transferHolder: process.env.TRANSFER_ACCOUNT_HOLDER ?? null,
      transferAlias: process.env.TRANSFER_ALIAS ?? null,
      transferCvu: process.env.TRANSFER_CVU ?? null,
      transferBank: process.env.TRANSFER_BANK_NAME ?? null,
    });
  } catch (notifyErr) {
    console.error("[POST /api/reservations] notifyReservationConfirmed error:", notifyErr);
  }

  return NextResponse.json({ ok: true, id: reservationId }, { status: 201 });
}
