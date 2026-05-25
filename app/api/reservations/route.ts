import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: Request) {
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
  if (
    !classId ||
    !spots ||
    spots < 1 ||
    !customerName ||
    !customerEmail ||
    !customerEmail.includes("@")
  ) {
    return NextResponse.json(
      { error: "missing_or_invalid_fields" },
      { status: 400 },
    );
  }

  /**console.log("[POST /api/reservations] Iniciando RPC...", {
    classId,
    spots,
    customerName,
    customerEmail,
  });*/

  const supabase = getSupabaseAdmin();

  // Llamar función transaccional
  /**console.log("[POST /api/reservations] Llamando RPC create_reservation_atomic...");*/
  const { data, error } = await supabase.rpc("create_reservation_atomic", {
    p_class_id: classId,
    p_customer_email: customerEmail,
    p_customer_name: customerName,
    p_customer_phone: customerPhone ?? null,
    p_idempotency_key: payload.idempotencyKey as string,
    p_notes: notes ?? null,
    p_spots: spots,
  });

  /**console.log("[POST /api/reservations] RPC completado. Error:", error, "Data:", data);*/

  if (error) {
    console.error("[POST /api/reservations] RPC error:", error);

    if (error.message.includes("not_available")) {
      return NextResponse.json(
        { error: "not_available" },
        { status: 409 },
      );
    }
    if (error.message.includes("duplicate")) {
      return NextResponse.json(
        { error: "duplicate" },
        { status: 409 },
      );
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

  // Traer los datos completos de la reserva que acabamos de crear
  const { data: reservationData, error: reservaError } = await supabase
    .from("reservations")
    .select("*")
    .eq("id", reservationId)
    .maybeSingle();

  if (reservaError || !reservationData) {
    console.error("[POST /api/reservations] Error obteniendo datos de reserva:", reservaError);
    return NextResponse.json({ ok: true, id: reservationId }, { status: 201 });
  }

  // Obtener datos de la clase para el email
  const { data: cls } = await supabase
    .from("classes")
    .select("*")
    .eq("id", classId)
    .maybeSingle();

  // ============================================
  // 📧 ENVIAR EMAILS (dentro del POST, tras éxito)
  // ============================================
  try {
    const { sendEmailReservaConfirmacion, sendEmailAdminNewReserva } =
      await import("@/lib/resend/send");

    // Helper para formatear fecha
    function formatDateLong(isoDate: string): string {
      if (!isoDate) return "—";
      const [y, m, d] = isoDate.split("-").map(Number);
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString("es-AR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }

    // Email al cliente
    await sendEmailReservaConfirmacion({
      customerName,
      customerEmail,
      className: cls?.title ?? "(clase)",
      classDate: formatDateLong(cls?.date ?? ""),
      classTime: `${cls?.start_time?.slice(0, 5) ?? ""} - ${cls?.end_time?.slice(0, 5) ?? ""}`,
      paymentLink: cls?.payment_link,
      cupos: spots,
    });

    // Email a la admin
    await sendEmailAdminNewReserva({
      customerName,
      customerEmail,
      customerPhone: customerPhone ?? null,
      className: cls?.title ?? "(clase)",
      classDate: formatDateLong(cls?.date ?? ""),
      cupos: spots,
      notes: notes ?? null,
    });
  } catch (emailErr) {
    // No bloqueamos si fallan los emails — es una notificación, no crítica
    console.error("[POST /api/reservations] Email error:", emailErr);
  }

  return NextResponse.json({ ok: true, id: reservationId }, { status: 201 });
}