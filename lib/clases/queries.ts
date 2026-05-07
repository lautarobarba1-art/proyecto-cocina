import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  classRowToClassMock,
  formatSessionLabel,
  type ClassRow,
} from "@/lib/calendar/adapters";
import type { ClassMock } from "@/lib/classes-mock";

/**
 * Devuelve la clase de un slug+fecha específicos. Se usa cuando el
 * usuario llega desde el calendario con ?fecha=YYYY-MM-DD.
 */
export async function getClassBySlugAndDate(
  slug: string,
  date: string,
): Promise<ClassMock | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("classes_with_availability")
    .select("*")
    .eq("slug", slug)
    .eq("date", date)
    .maybeSingle();

  if (error) {
    console.error("[getClassBySlugAndDate]", error);
    return null;
  }
  if (!data) return null;
  return classRowToClassMock(data as ClassRow);
}

/**
 * Devuelve la próxima sesión futura de un slug, o cualquier sesión
 * si no hay futuras. Se usa cuando alguien entra a /clases/[slug]
 * sin ?fecha= y necesitamos un fallback.
 */
export async function getDefaultClassBySlug(
  slug: string,
): Promise<ClassMock | null> {
  const supabase = getSupabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);

  // Primero buscar futura no cancelada
  const { data: future } = await supabase
    .from("classes_with_availability")
    .select("*")
    .eq("slug", slug)
    .eq("is_cancelled", false)
    .gte("date", today)
    .order("date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (future) return classRowToClassMock(future as ClassRow);

  // Fallback: cualquier sesión, por fecha más reciente
  const { data: any } = await supabase
    .from("classes_with_availability")
    .select("*")
    .eq("slug", slug)
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!any) return null;
  return classRowToClassMock(any as ClassRow);
}

/**
 * Devuelve las próximas sesiones disponibles para un slug, formateadas
 * como labels para el <select> del form de reserva.
 */
export async function getSessionsForClass(
  slug: string,
): Promise<{ id: string; label: string; classId: string; date: string }[]> {
  const supabase = getSupabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("classes_with_availability")
    .select("id, slug, date, start_time, end_time, is_cancelled, spots_left")
    .eq("slug", slug)
    .eq("is_cancelled", false)
    .gte("date", today)
    .gt("spots_left", 0)
    .order("date", { ascending: true });

  if (error) {
    console.error("[getSessionsForClass]", error);
    return [];
  }
  if (!data) return [];

  return data.map((row) => {
    const startTime = row.start_time.slice(0, 5);
    const endTime = row.end_time.slice(0, 5);
    return {
      id: row.id,
      classId: row.id,
      date: row.date,
      label: formatSessionLabel(row.date, startTime, endTime),
    };
  });
}

/**
 * Devuelve todas las clases para el catálogo /clases (lista única por slug,
 * agarrando la próxima sesión futura de cada uno).
 */
export async function getAllClassesForCatalog(): Promise<ClassMock[]> {
  const supabase = getSupabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("classes_with_availability")
    .select("*")
    .gte("date", today)
    .order("date", { ascending: true });

  if (error) {
    console.error("[getAllClassesForCatalog]", error);
    return [];
  }
  if (!data) return [];

  // Deduplicar por slug, priorizando la primera fecha futura
  const seen = new Set<string>();
  const unique: ClassMock[] = [];
  for (const row of data as ClassRow[]) {
    if (seen.has(row.slug)) continue;
    seen.add(row.slug);
    unique.push(classRowToClassMock(row));
  }
  return unique;
}