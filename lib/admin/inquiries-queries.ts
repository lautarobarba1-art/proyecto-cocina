import { getSupabaseAdmin } from "@/lib/supabase/server";

/**
 * Cuenta consultas sin leer (`status='new'`). Usado por el dashboard para
 * mostrar el dato sin obligar a la admin a entrar a /admin/inquiries.
 */
export async function countNewInquiries(): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from("inquiries")
    .select("id", { count: "exact", head: true })
    .eq("status", "new");

  if (error) {
    console.error("[countNewInquiries]", error);
    return 0;
  }
  return count ?? 0;
}
