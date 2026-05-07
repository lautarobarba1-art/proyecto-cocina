/**
 * Tipos y catálogo de clases.
 *
 * NOTA: el array CLASSES_MOCK y DEFAULT_CLASS_SESSIONS se conservan
 * solo como FALLBACK por si algo del código aún los importa.
 * Las funciones getClassBySlug y getClassCategories ahora consultan
 * Supabase a través de queries.
 */

import { getDefaultClassBySlug, getAllClassesForCatalog } from "@/lib/clases/queries";

export type ClassStatus = "disponible" | "últimos cupos" | "agotado";

export interface ClassMock {
  id: string;
  slug: string;
  title: string;
  category: string;
  price: string;
  duration: string;
  description: string;
  image: {
    src: string;
    alt: string;
  };
  status: ClassStatus;
}

/**
 * Fallback estático. NO se usa en runtime si Supabase responde.
 * Solo queda por compatibilidad con código que aún importe el array directo.
 */
export const CLASSES_MOCK: ClassMock[] = [];

/** Sesiones mock — fallback si Supabase no devuelve nada. */
export const DEFAULT_CLASS_SESSIONS: { id: string; label: string }[] = [];

export function getClassCategories(classes: ClassMock[]): string[] {
  const set = new Set(classes.map((c) => c.category));
  return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
}

/**
 * Versión async que consulta Supabase. La firma original era sync,
 * pero los consumidores son Server Components que ya pueden esperar promesas.
 */
export async function getClassBySlug(slug: string): Promise<ClassMock | null> {
  return getDefaultClassBySlug(slug);
}

/** Versión async para el catálogo en /clases */
export async function getAllClasses(): Promise<ClassMock[]> {
  return getAllClassesForCatalog();
}
