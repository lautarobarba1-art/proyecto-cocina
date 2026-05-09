import { getSupabaseAdmin } from "@/lib/supabase/server";

/**
 * Una reserva con los datos de su clase asociada, lista para mostrar
 * en el listado del admin.
 */
export interface ReservaAdmin {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  notes: string | null;
  spots: number;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
  // Datos de la clase
  classId: string;
  classSlug: string;
  classTitle: string;
  classDate: string; // YYYY-MM-DD
  classStartTime: string; // HH:MM
  classIsCancelled: boolean;
}

/**
 * Trae las últimas N reservas (todas, ordenadas por fecha de creación
 * descendente). En el MVP no hay filtros — vienen los próximos pasos.
 */
export async function getReservasForAdmin(
  limit: number = 50,
): Promise<ReservaAdmin[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("reservations")
    .select(
      `
      id,
      customer_name,
      customer_email,
      customer_phone,
      notes,
      spots,
      status,
      created_at,
      confirmed_at,
      cancelled_at,
      class_id,
      classes (
        slug,
        title,
        date,
        start_time,
        is_cancelled
      )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getReservasForAdmin]", error);
    throw new Error(`Failed to fetch reservas: ${error.message}`);
  }

  if (!data) return [];

  return data.map((row) => {
    // Supabase devuelve `classes` como objeto si es FK 1:1
    const cls = (row as unknown as { classes: {
      slug: string;
      title: string;
      date: string;
      start_time: string;
      is_cancelled: boolean;
    } | null }).classes;

    return {
      id: row.id,
      customerName: row.customer_name,
      customerEmail: row.customer_email,
      customerPhone: row.customer_phone,
      notes: row.notes,
      spots: row.spots,
      status: row.status as ReservaAdmin["status"],
      createdAt: row.created_at,
      confirmedAt: row.confirmed_at,
      cancelledAt: row.cancelled_at,
      classId: row.class_id,
      classSlug: cls?.slug ?? "",
      classTitle: cls?.title ?? "(clase eliminada)",
      classDate: cls?.date ?? "",
      classStartTime: cls?.start_time?.slice(0, 5) ?? "",
      classIsCancelled: cls?.is_cancelled ?? false,
    };
  });
}