import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Cliente Supabase para Server Components / Route Handlers.
 *
 * Lee la sesión del usuario desde las cookies. Se usa para:
 *   - Verificar si el usuario actual está autenticado
 *   - Verificar si es un admin autorizado
 *
 * NO confundir con `getSupabaseAdmin()` de server.ts, que usa
 * SERVICE_ROLE y bypassa RLS. Este cliente respeta RLS.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "[supabase/auth-server] Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components no pueden setear cookies — se ignora silencioso.
          // El middleware se encarga de refrescar tokens.
        }
      },
    },
  });
}

/**
 * Devuelve el email del usuario autenticado actual, o null si no hay sesión.
 */
export async function getCurrentUserEmail(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user.email ?? null;
}