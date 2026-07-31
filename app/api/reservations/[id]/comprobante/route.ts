import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { checkComprobanteLimit, getIp } from "@/lib/ratelimit";
import { getMagicMime } from "@/lib/file-utils";
import { notifyComprobanteUploaded } from "@/lib/notifications/notify";
import { siteContact } from "@/lib/site/contact";

export const runtime = "nodejs";

const MAX_SIZE = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rl = await checkComprobanteLimit(getIp(req));
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "too_many_requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  const { id } = await params;

  const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "invalid_form_data" }, { status: 400 });
  }

  const file = formData.get("comprobante");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "invalid_file_type" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "file_too_large" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);

  const realMime = getMagicMime(fileBuffer);
  if (!realMime || !ALLOWED_TYPES.has(realMime)) {
    return NextResponse.json({ error: "invalid_file_type" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: reservation } = await supabase
    .from("reservations")
    .select("customer_name, customer_email, class_id, comprobante_url, spots, status")
    .eq("id", id)
    .maybeSingle();

  if (!reservation) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (reservation.comprobante_url) {
    return NextResponse.json({ error: "comprobante_already_exists" }, { status: 409 });
  }

  // Ej: el cron de expiración (lib/notifications/payment-deadline-dispatch.ts)
  // ya canceló esta reserva por falta de comprobante, y el cliente recién
  // ahora vuelve (pestaña vieja, link del email usado tarde) a subirlo.
  if (reservation.status !== "pending") {
    return NextResponse.json({ error: "reservation_not_pending" }, { status: 409 });
  }

  const safeName = reservation.customer_name.replace(/[^a-zA-Z0-9_\-]/g, "_");
  const rawExt = file.name.includes(".")
    ? file.name.split(".").pop()!
    : realMime.split("/")[1] ?? "bin";
  const ext = rawExt.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10);
  const fileName = `comprobante_${safeName}.${ext}`;
  const storagePath = `${id}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("comprobantes")
    .upload(storagePath, fileBuffer, {
      contentType: realMime,
      upsert: false,
    });

  if (uploadError) {
    console.error("[POST /api/reservations/[id]/comprobante]", uploadError);
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }

  const { data: updated, error: updateError } = await supabase
    .from("reservations")
    .update({
      comprobante_url: storagePath,
      comprobante_uploaded_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (updateError) {
    console.error("[POST /api/reservations/[id]/comprobante] DB update error:", updateError);
    return NextResponse.json({ error: "db_update_failed" }, { status: 500 });
  }
  if (!updated) {
    // Carrera con el cron de expiración entre el check de arriba y este UPDATE
    // (ventana angosta: el cron corre una vez por hora, no es un caso frecuente).
    // El archivo ya se subió a Storage — queda huérfano, mismo trade-off de
    // "best effort" que ya documenta notification_log para otros casos límite.
    return NextResponse.json({ error: "reservation_not_pending" }, { status: 409 });
  }

  // Aviso a la admin (nunca revierte la subida del comprobante, que ya se persistió).
  try {
    const { data: cls } = await supabase
      .from("classes")
      .select("title")
      .eq("id", reservation.class_id)
      .maybeSingle();

    await notifyComprobanteUploaded(supabase, {
      reservationId: id,
      classId: reservation.class_id,
      customerName: reservation.customer_name,
      customerEmail: reservation.customer_email,
      className: cls?.title ?? "(clase)",
      spots: reservation.spots,
      reviewUrl: `${siteContact.siteUrl}/admin/reservas`,
    });
  } catch (notifyErr) {
    console.error("[POST /api/reservations/[id]/comprobante] notifyComprobanteUploaded error:", notifyErr);
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
