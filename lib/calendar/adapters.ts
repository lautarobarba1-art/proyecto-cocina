import type { ClassEvent, ClassStatus } from "@/lib/calendar/types";
import type { ClassMock, ClassStatus as MockClassStatus } from "@/lib/classes-mock";

/**
 * Fila tal como viene de la vista `classes_with_availability` en Supabase.
 * Usamos snake_case porque así llegan desde Postgres.
 */
export interface ClassRow {
  id: string;
  slug: string;
  date: string; // YYYY-MM-DD
  title: string;
  start_time: string; // HH:MM:SS
  end_time: string;

  category_event: "adultos" | "ninos" | "eventos";
  short_desc: string;
  is_highlighted: boolean;

  category_label: string;
  description_long: string;
  duration_label: string;
  image_src: string;
  image_alt: string;

  total_spots: number;
  price: number | string; // numeric viene como string en algunos drivers
  payment_link: string | null;
  is_cancelled: boolean;

  spots_left: number; // calculado por la vista
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------

/** Postgres time viene como "HH:MM:SS"; el tipo del proyecto usa "HH:MM" */
function trimSeconds(t: string): string {
  return t.length === 8 ? t.slice(0, 5) : t;
}

function toNumber(v: number | string): number {
  return typeof v === "string" ? parseFloat(v) : v;
}

/**
 * Deriva el status del calendario (ClassEvent) según cupos disponibles.
 * - cancelled: clase cancelada manualmente
 * - full: sin cupos
 * - few-spots: ≤30% de cupos restantes
 * - available: resto
 */
export function deriveEventStatus(
  totalSpots: number,
  spotsLeft: number,
  isCancelled: boolean,
): ClassStatus {
  if (isCancelled) return "cancelled";
  if (spotsLeft <= 0) return "full";
  const threshold = Math.max(1, Math.ceil(totalSpots * 0.3));
  if (spotsLeft <= threshold) return "few-spots";
  return "available";
}

/**
 * Deriva el status de la ficha (ClassMock) — usa labels en español.
 * Nótese que ClassMock no tiene "cancelled"; las clases canceladas
 * deberían filtrarse antes de mostrarse en /clases/[slug].
 */
export function deriveMockStatus(
  totalSpots: number,
  spotsLeft: number,
): MockClassStatus {
  if (spotsLeft <= 0) return "agotado";
  const threshold = Math.max(1, Math.ceil(totalSpots * 0.3));
  if (spotsLeft <= threshold) return "últimos cupos";
  return "disponible";
}

// ---------------------------------------------------------------------
// Adaptadores principales
// ---------------------------------------------------------------------

/**
 * Convierte una fila de DB en un ClassEvent del calendario.
 */
export function classRowToClassEvent(row: ClassRow): ClassEvent {
  const totalSpots = row.total_spots;
  const spotsLeft = row.spots_left;
  const status = deriveEventStatus(totalSpots, spotsLeft, row.is_cancelled);

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    date: row.date,
    startTime: trimSeconds(row.start_time),
    endTime: trimSeconds(row.end_time),
    category: row.category_event,
    status,
    spotsLeft: status === "cancelled" || status === "full" ? null : spotsLeft,
    totalSpots,
    price: toNumber(row.price),
    shortDesc: row.short_desc,
    isHighlighted: row.is_highlighted || undefined,
  };
}

/**
 * Formato de precio del catálogo: "$ 45.000".
 */
function formatPriceArs(price: number): string {
  const rounded = Math.round(price);
  const formatted = new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 0,
  }).format(rounded);
  return `$ ${formatted}`;
}

/**
 * Convierte una fila de DB en un ClassMock para la ficha de detalle.
 */
export function classRowToClassMock(row: ClassRow): ClassMock {
  const totalSpots = row.total_spots;
  const spotsLeft = row.spots_left;
  const status = deriveMockStatus(totalSpots, spotsLeft);

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category_label,
    price: formatPriceArs(toNumber(row.price)),
    duration: row.duration_label,
    description: row.description_long,
    image: {
      src: row.image_src,
      alt: row.image_alt,
    },
    status,
  };
}

/**
 * Convierte una fecha + horarios en el label legible que usa el
 * <select> de turnos (formato: "Sábado 17 de mayo · 10:00 — 13:30").
 */
export function formatSessionLabel(
  isoDate: string,
  startTime: string,
  endTime: string,
): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);

  const dayName = date.toLocaleDateString("es-AR", { weekday: "long" });
  const dayNumber = date.getDate();
  const monthName = date.toLocaleDateString("es-AR", { month: "long" });

  const dayCap = dayName.charAt(0).toUpperCase() + dayName.slice(1);

  return `${dayCap} ${dayNumber} de ${monthName} · ${startTime} — ${endTime}`;
}