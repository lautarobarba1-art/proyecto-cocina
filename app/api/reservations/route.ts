import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { checkReservationsLimit, getIp } from "@/lib/ratelimit";
import { normalizeArgentinePhone } from "@/lib/whatsapp/phone";
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
  // Consentimiento explícito para WhatsApp: nunca implícito por el solo hecho
  // de haber cargado un teléfono. Default false si no viene (no marcado por
  // defecto en el formulario).
  const whatsappConsent = payload.whatsappConsent === true;

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

  // Teléfono: opcional (mantiene compatibilidad con reservas sin WhatsApp),
  // pero si el cliente cargó algo, tiene que ser un número argentino válido.
  // La validación del cliente es solo una ayuda visual — esta es la
  // autoritativa. customer_phone guarda el valor tal cual lo tipeó la
  // persona (sin cambios); customer_phone_normalized guarda el E.164 que
  // WhatsApp va a usar — se calcula acá, una sola vez, y se persiste en la
  // misma transacción que crea la reserva (ver create_reservation_atomic).
  const hasPhoneInput = typeof customerPhone === "string" && customerPhone.trim() !== "";
  const phoneCheck = hasPhoneInput ? normalizeArgentinePhone(customerPhone) : null;
  if (hasPhoneInput && !phoneCheck!.valid) {
    return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
  }
  const customerPhoneNormalized = phoneCheck?.valid ? phoneCheck.e164 : null;

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

  // Llamar función transaccional — teléfono normalizado y consentimiento se
  // persisten DENTRO de esta misma transacción, no en un paso separado.
  const { data, error } = await supabase.rpc("create_reservation_atomic", {
    p_class_id: classId,
    p_customer_email: customerEmail,
    p_customer_name: customerName,
    p_customer_phone: customerPhone ?? null,
    p_idempotency_key: payload.idempotencyKey as string,
    p_notes: notes ?? null,
    p_spots: spots,
    p_customer_phone_normalized: customerPhoneNormalized,
    p_whatsapp_consent: whatsappConsent,
    p_whatsapp_consent_at: whatsappConsent ? new Date().toISOString() : null,
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

  // Releemos el consentimiento/teléfono normalizado YA PERSISTIDOS (no el
  // valor en memoria de este request) antes de notificar. Esto cubre tanto
  // el alta nueva (created.was_created=true, recién insertado por la RPC de
  // arriba en esta misma transacción) como una réplica por idempotency_key
  // (created.was_created=false, donde lo que vale es lo que quedó guardado
  // en el alta original, no lo que venga en este request repetido). Así
  // WhatsApp nunca se intenta a partir de un consentimiento que no quedó
  // efectivamente en la base.
  const { data: persisted } = await supabase
    .from("reservations")
    .select("customer_phone_normalized, whatsapp_consent")
    .eq("id", reservationId)
    .maybeSingle();

  // Obtener datos de la clase para las notificaciones
  const { data: cls } = await supabase
    .from("classes")
    .select("title, date, start_time, end_time, deposit_amount")
    .eq("id", classId)
    .maybeSingle();

  // ============================================
  // 📧 📱 Notificar (fire con timeout interno por canal; nunca revierte la reserva)
  // ============================================
  try {
    await notifyReservationConfirmed(supabase, {
      reservationId,
      classId,
      customerName,
      customerEmail,
      customerPhoneNormalized: persisted?.customer_phone_normalized ?? null,
      whatsappConsent: persisted?.whatsapp_consent ?? false,
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
