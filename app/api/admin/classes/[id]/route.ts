import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getCurrentUserEmail } from "@/lib/supabase/auth-server";
import { isAdminEmail } from "@/lib/admin/config";
import {
  validateClaseForm,
  type ClaseFormData,
} from "@/lib/admin/clases-validation";
import {
  eventoFormToDbRow,
  validateEventoForm,
  type EventoFormData,
} from "@/lib/admin/eventos-validation";
import {
  notifyReservationsOfReschedule,
  hasScheduleChanged,
} from "@/lib/notifications/reschedule-dispatch";

export const runtime = "nodejs";

function isEventoKind(body: Record<string, unknown>): boolean {
  return body.kind === "evento";
}

interface ClaseBeforeRow {
  date: string;
  start_time: string;
  end_time: string;
}

/**
 * Best-effort: si la fecha/horario cambió, avisa a las reservas activas.
 * Un fallo acá nunca debe impactar la respuesta del PATCH — la clase ya
 * quedó guardada.
 */
async function notifyIfRescheduled(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  classId: string,
  className: string,
  before: ClaseBeforeRow,
  after: { date: string; startTime: string; endTime: string },
): Promise<void> {
  if (
    !hasScheduleChanged(
      { date: before.date, startTime: before.start_time, endTime: before.end_time },
      after,
    )
  ) {
    return;
  }

  try {
    await notifyReservationsOfReschedule(supabase, classId, className, {
      oldDateISO: before.date,
      oldStartTime: before.start_time,
      oldEndTime: before.end_time,
      newDateISO: after.date,
      newStartTime: after.startTime,
      newEndTime: after.endTime,
    });
  } catch (err) {
    console.error("[PATCH /api/admin/classes] notifyReservationsOfReschedule falló:", err);
  }
}

/**
 * PATCH /api/admin/classes/[id]
 * Body: { kind: "clase", ...ClaseFormData } | { kind: "evento", ...EventoFormData }
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const payload = body as Record<string, unknown>;
  const supabase = getSupabaseAdmin();

  const { data: before, error: beforeError } = await supabase
    .from("classes")
    .select("date, start_time, end_time")
    .eq("id", id)
    .maybeSingle<ClaseBeforeRow>();

  if (beforeError) {
    // No abortamos el PATCH por esto: solo significa que no vamos a poder
    // avisar por email si la clase termina reprogramándose. Se loguea para
    // no perder de vista por qué no se notificó, a diferencia de un "before"
    // null legítimo (clase realmente no encontrada).
    console.error("[PATCH /api/admin/classes] fetch de estado previo falló:", beforeError);
  }

  if (isEventoKind(payload)) {
    const data = payload as Partial<EventoFormData>;
    const { ok, errors } = validateEventoForm(data);
    if (!ok) {
      return NextResponse.json(
        { error: "validation_failed", fieldErrors: errors },
        { status: 400 },
      );
    }

    const v = data as EventoFormData;
    const { data: updated, error } = await supabase
      .from("classes")
      .update(eventoFormToDbRow(v))
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
      console.error("[PATCH /api/admin/classes evento]", error);
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }

    if (!updated) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    if (before) {
      await notifyIfRescheduled(supabase, id, v.title, before, {
        date: v.date,
        startTime: v.startTime,
        endTime: v.endTime,
      });
    }

    return NextResponse.json({ ok: true });
  }

  const data = payload as Partial<ClaseFormData>;
  const { ok, errors } = validateClaseForm(data);
  if (!ok) {
    return NextResponse.json(
      { error: "validation_failed", fieldErrors: errors },
      { status: 400 },
    );
  }

  const v = data as ClaseFormData;
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
      deposit_amount: v.depositAmount,
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

  if (before) {
    await notifyIfRescheduled(supabase, id, v.title, before, {
      date: v.date,
      startTime: v.startTime,
      endTime: v.endTime,
    });
  }

  return NextResponse.json({ ok: true });
}
