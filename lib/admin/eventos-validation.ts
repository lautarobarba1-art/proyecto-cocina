import { isValidSlug } from "@/lib/admin/clases-validation";

/** Campos mínimos para un evento privado (espacio alquilado, sin reserva online). */
export interface EventoFormData {
  slug: string;
  date: string;
  title: string;
  startTime: string;
  endTime: string;
  /** Etiqueta visible, ej. "Cumpleaños", "Cena privada". */
  categoryLabel: string;
  /** Texto que aparece en el preview del calendario. */
  shortDesc: string;
}

export interface EventoValidationResult {
  ok: boolean;
  errors: Partial<Record<keyof EventoFormData, string>>;
}

export function validateEventoForm(
  data: Partial<EventoFormData>,
): EventoValidationResult {
  const errors: Partial<Record<keyof EventoFormData, string>> = {};

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
  if (!data.categoryLabel || data.categoryLabel.trim().length < 2) {
    errors.categoryLabel = "Categoría requerida (mínimo 2 caracteres).";
  }
  if (!data.shortDesc || data.shortDesc.trim().length < 5) {
    errors.shortDesc = "Descripción requerida (mínimo 5 caracteres).";
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

/** Valores fijos al persistir un evento privado en `classes`. */
export function eventoFormToDbRow(form: EventoFormData) {
  return {
    slug: form.slug,
    date: form.date,
    title: form.title,
    start_time: form.startTime,
    end_time: form.endTime,
    category_event: "eventos" as const,
    category_label: form.categoryLabel.trim(),
    short_desc: form.shortDesc.trim(),
    description_long: form.shortDesc.trim(),
    duration_label: "",
    image_src: "",
    image_alt: "",
    total_spots: 1,
    price: 0,
    payment_link: null,
    is_highlighted: false,
    is_cancelled: false,
  };
}

export function dbRowToEventoForm(row: {
  slug: string;
  date: string;
  title: string;
  start_time: string;
  end_time: string;
  category_label: string;
  short_desc: string;
}): EventoFormData {
  return {
    slug: row.slug,
    date: row.date,
    title: row.title,
    startTime: row.start_time?.slice(0, 5) ?? "",
    endTime: row.end_time?.slice(0, 5) ?? "",
    categoryLabel: row.category_label,
    shortDesc: row.short_desc,
  };
}
