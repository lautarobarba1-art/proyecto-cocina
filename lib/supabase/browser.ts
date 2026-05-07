"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para usar desde Client Components.
 *
 * Usa la ANON_KEY (pública). NO bypassa RLS — las policies se aplican
 * normalmente. Para el form de login esto es lo correcto: la operación
 * de auth necesita el cliente del browser.
 */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "[supabase/browser] Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  return createBrowserClient(url, anonKey);
}