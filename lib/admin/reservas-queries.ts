import { getSupabaseAdmin } from "@/lib/supabase/server";

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
  classId: string;
  classSlug: string;
  classTitle: string;
  classDate: string;
  classStartTime: string;
  classIsCancelled: boolean;
}

export interface ReservasFilter {
  status?: "pending" | "confirmed" | "cancelled" | "all";
  mes?: string; // YYYY-MM
}

export async function getReservasForAdmin(
  limit: number = 200,
  filter: ReservasFilter = {},
): Promise<ReservaAdmin[]> {
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from("reservations")
    .select(`
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
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  // Filtro por estado
  if (filter.status && filter.status !== "all") {
    query = query.eq("status", filter.status);
  }

  // Filtro por mes (filtra por fecha de la clase, no de la reserva)
  if (filter.mes) {
    const [y, m] = filter.mes.split("-").map(Number);
    const start = `${y}-${String(m).padStart(2, "0")}-01`;
    const end = new Date(y, m, 0); // último día del mes
    const endStr = `${y}-${String(m).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
    query = query.gte("classes.date", start).lte("classes.date", endStr);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[getReservasForAdmin]", error);
    throw new Error(`Failed to fetch reservas: ${error.message}`);
  }

  if (!data) return [];

  return data
    .map((row) => {
      const cls = (
        row as unknown as {
          classes: {
            slug: string;
            title: string;
            date: string;
            start_time: string;
            is_cancelled: boolean;
          } | null;
        }
      ).classes;

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
    })
    .filter((r) => {
      // Filtro de mes en JS (por si Supabase no filtra bien por FK)
      if (!filter.mes) return true;
      return r.classDate.startsWith(filter.mes);
    });
}

/**
 * Genera contenido CSV de las reservas para export.
 */
export function reservasToCSV(reservas: ReservaAdmin[]): string {
  const headers = [
    "Fecha reserva",
    "Nombre",
    "Email",
    "Teléfono",
    "Clase",
    "Fecha clase",
    "Horario",
    "Cupos",
    "Estado",
    "Notas",
  ];

  const escape = (val: string | null | undefined): string => {
    if (!val) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const statusLabel = (s: ReservaAdmin["status"]) => {
    if (s === "pending") return "Pendiente";
    if (s === "confirmed") return "Pagada";
    return "Cancelada";
  };

  const rows = reservas.map((r) => [
    escape(new Date(r.createdAt).toLocaleDateString("es-AR")),
    escape(r.customerName),
    escape(r.customerEmail),
    escape(r.customerPhone),
    escape(r.classTitle),
    escape(r.classDate),
    escape(r.classStartTime),
    escape(String(r.spots)),
    escape(statusLabel(r.status)),
    escape(r.notes),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}