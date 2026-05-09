import { getSupabaseAdmin } from "@/lib/supabase/server";

/**
 * Una clase tal como la ve el admin: incluye datos calculados
 * (cupos restantes, cantidad de reservas activas) que no están en
 * la tabla raw.
 */
export interface ClaseAdmin {
  id: string;
  slug: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  categoryEvent: "adultos" | "ninos" | "eventos";
  categoryLabel: string;
  totalSpots: number;
  spotsLeft: number;
  price: number;
  paymentLink: string | null;
  isCancelled: boolean;
  isHighlighted: boolean;
  shortDesc: string;
  descriptionLong: string;
  durationLabel: string;
  imageSrc: string;
  imageAlt: string;
  // Conteo de reservas activas (para mostrar al admin "tenés N reservas en esta clase")
  activeReservationsCount: number;
}

export interface GetClasesOptions {
  /** Si true, solo trae próximas (date >= hoy) y no canceladas. */
  onlyUpcoming?: boolean;
  limit?: number;
}

/**
 * Trae todas las clases para el panel admin, con conteo de reservas
 * activas por clase.
 */
export async function getClasesForAdmin(
  options: GetClasesOptions = {},
): Promise<ClaseAdmin[]> {
  const { onlyUpcoming = false, limit = 200 } = options;
  const supabase = getSupabaseAdmin();

  // Query de classes con spots_left de la vista
  let query = supabase
    .from("classes_with_availability")
    .select("*")
    .order("date", { ascending: false })
    .order("start_time", { ascending: false })
    .limit(limit);

  if (onlyUpcoming) {
    const today = new Date().toISOString().slice(0, 10);
    query = query.gte("date", today).eq("is_cancelled", false);
  }

  const { data: classesData, error: classesError } = await query;

  if (classesError) {
    console.error("[getClasesForAdmin]", classesError);
    throw new Error(`Failed to fetch classes: ${classesError.message}`);
  }

  if (!classesData || classesData.length === 0) {
    return [];
  }

  // Conteo de reservas activas (pending + confirmed) por class_id
  const classIds = classesData.map((c) => c.id);
  const { data: countData, error: countError } = await supabase
    .from("reservations")
    .select("class_id, status")
    .in("class_id", classIds)
    .in("status", ["pending", "confirmed"]);

  if (countError) {
    console.error("[getClasesForAdmin reservations]", countError);
    // No bloqueamos, solo mostramos 0
  }

  // Agrupar por class_id
  const countByClass = new Map<string, number>();
  for (const r of countData ?? []) {
    countByClass.set(r.class_id, (countByClass.get(r.class_id) ?? 0) + 1);
  }

  return classesData.map((c) => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
    date: c.date,
    startTime: c.start_time?.slice(0, 5) ?? "",
    endTime: c.end_time?.slice(0, 5) ?? "",
    categoryEvent: c.category_event,
    categoryLabel: c.category_label,
    totalSpots: c.total_spots,
    spotsLeft: c.spots_left ?? c.total_spots,
    price:
      typeof c.price === "string" ? parseFloat(c.price) : (c.price as number),
    paymentLink: c.payment_link,
    isCancelled: c.is_cancelled,
    isHighlighted: c.is_highlighted,
    shortDesc: c.short_desc,
    descriptionLong: c.description_long,
    durationLabel: c.duration_label,
    imageSrc: c.image_src,
    imageAlt: c.image_alt,
    activeReservationsCount: countByClass.get(c.id) ?? 0,
  }));
}

/**
 * Cuenta reservas activas (pending + confirmed) de una clase.
 * Usado antes de cancelar una clase, para avisar al admin
 * cuántos clientes va a tener que notificar manualmente.
 */
export async function countActiveReservations(classId: string): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from("reservations")
    .select("id", { count: "exact", head: true })
    .eq("class_id", classId)
    .in("status", ["pending", "confirmed"]);

  if (error) {
    console.error("[countActiveReservations]", error);
    return 0;
  }
  return count ?? 0;
}