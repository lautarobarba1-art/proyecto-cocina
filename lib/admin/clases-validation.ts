import { getSupabaseAdmin } from "@/lib/supabase/server";

/**
 * Convierte un título humano en un slug URL-friendly.
 * "Pasta Fresca en Casa" → "pasta-fresca-en-casa"
 * "Empanadas (familias)" → "empanadas-familias"
 * "Crème brûlée" → "creme-brulee"
 */
export function slugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD") // separa acentos
    .replace(/[\u0300-\u036f]/g, "") // quita acentos
    .replace(/[^a-z0-9\s-]/g, "") // solo letras, dígitos, espacios y guiones
    .trim()
    .replace(/\s+/g, "-") // espacios → guiones
    .replace(/-+/g, "-") // múltiples guiones → uno
    .replace(/^-|-$/g, ""); // sin guiones al principio/final
}

/**
 * Valida que un slug tenga el formato correcto.
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
}

/**
 * Datos del formulario de clase. Es lo que viaja desde el cliente
 * al endpoint POST/PATCH.
 */
export interface ClaseFormData {
  slug: string;
  date: string; // YYYY-MM-DD
  title: string;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  categoryEvent: "adultos" | "ninos" | "eventos";
  shortDesc: string;
  isHighlighted: boolean;
  categoryLabel: string;
  descriptionLong: string;
  durationLabel: string;
  imageSrc: string;
  imageAlt: string;
  totalSpots: number;
  price: number;
  paymentLink: string | null;
}

export interface ValidationResult {
  ok: boolean;
  errors: Partial<Record<keyof ClaseFormData, string>>;
}

/**
 * Valida los campos del formulario. No hace queries — eso queda para
 * el endpoint (chequear duplicados, etc.).
 */
export function validateClaseForm(data: Partial<ClaseFormData>): ValidationResult {
  const errors: Partial<Record<keyof ClaseFormData, string>> = {};

  if (!data.title || data.title.trim().length < 3) {
    errors.title = "El título debe tener al menos 3 caracteres.";
  }
  if (!data.slug || !isValidSlug(data.slug)) {
    errors.slug = "Slug inválido (solo lowercase, dígitos y guiones).";
  }
  if (!data.date || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    errors.date = "Fecha inválida.";
  }
  if (!data.startTime || !/^\d{2}:\d{2}$/.test(data.startTime)) {
    errors.startTime = "Hora de inicio inválida.";
  }
  if (!data.endTime || !/^\d{2}:\d{2}$/.test(data.endTime)) {
    errors.endTime = "Hora de fin inválida.";
  }
  if (data.startTime && data.endTime && data.endTime <= data.startTime) {
    errors.endTime = "La hora de fin debe ser posterior a la de inicio.";
  }
  if (!data.categoryEvent || !["adultos", "ninos", "eventos"].includes(data.categoryEvent)) {
    errors.categoryEvent = "Categoría calendario inválida.";
  }
  if (!data.shortDesc || data.shortDesc.trim().length < 5) {
    errors.shortDesc = "Descripción corta requerida (mínimo 5 caracteres).";
  }
  if (!data.categoryLabel || data.categoryLabel.trim().length < 2) {
    errors.categoryLabel = "Categoría visible requerida.";
  }
  if (!data.descriptionLong || data.descriptionLong.trim().length < 10) {
    errors.descriptionLong = "Descripción larga requerida (mínimo 10 caracteres).";
  }
  if (!data.durationLabel || data.durationLabel.trim().length < 1) {
    errors.durationLabel = "Duración requerida (ej: '2 horas').";
  }
  if (!data.imageSrc || !/^https?:\/\//.test(data.imageSrc)) {
    errors.imageSrc = "URL de imagen inválida (debe empezar con http:// o https://).";
  }
  if (!data.imageAlt || data.imageAlt.trim().length < 3) {
    errors.imageAlt = "Texto alternativo de imagen requerido.";
  }
  if (
    typeof data.totalSpots !== "number" ||
    !Number.isFinite(data.totalSpots) ||
    data.totalSpots < 1 ||
    data.totalSpots > 100
  ) {
    errors.totalSpots = "Cupos inválidos (1-100).";
  }
  if (
    typeof data.price !== "number" ||
    !Number.isFinite(data.price) ||
    data.price < 0
  ) {
    errors.price = "Precio inválido (no puede ser negativo).";
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

/**
 * Trae la última clase con un slug dado, para auto-completar
 * un formulario nuevo (plantilla por slug).
 */
export async function getTemplateBySlug(slug: string): Promise<{
  title: string;
  categoryEvent: "adultos" | "ninos" | "eventos";
  categoryLabel: string;
  shortDesc: string;
  descriptionLong: string;
  durationLabel: string;
  imageSrc: string;
  imageAlt: string;
  price: number;
  totalSpots: number;
} | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("classes")
    .select(
      "title, category_event, category_label, short_desc, description_long, duration_label, image_src, image_alt, price, total_spots",
    )
    .eq("slug", slug)
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return {
    title: data.title,
    categoryEvent: data.category_event,
    categoryLabel: data.category_label,
    shortDesc: data.short_desc,
    descriptionLong: data.description_long,
    durationLabel: data.duration_label,
    imageSrc: data.image_src,
    imageAlt: data.image_alt,
    price: typeof data.price === "string" ? parseFloat(data.price) : data.price,
    totalSpots: data.total_spots,
  };
}