import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase server-side con SERVICE_ROLE key.
 *
 * IMPORTANTE: este cliente bypassa RLS. Solo debe usarse en:
 *   - Route handlers (app/api/**)
 *   - Server components que necesiten escritura
 *   - Server actions
 *
 * NUNCA importarlo desde un componente "use client" o exponer al browser.
 *
 * Lazy singleton: el cliente se crea en el primer uso para no fallar
 * en build time si las env vars no están seteadas en algún entorno.
 */

let _client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (_client) return _client;

  const url =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error(
      "[supabase/server] Falta SUPABASE_URL (o NEXT_PUBLIC_SUPABASE_URL) en variables de entorno. " +
        "Revisá que exista un archivo .env.local en la raíz del proyecto (junto a package.json), reiniciá npm run dev.",
    );
  }
  if (!serviceKey) {
    throw new Error(
      "[supabase/server] Falta SUPABASE_SERVICE_ROLE_KEY en variables de entorno",
    );
  }

  _client = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: "public",
    },
  });

  return _client;
}