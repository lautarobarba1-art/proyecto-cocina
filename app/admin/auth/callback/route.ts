import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAdminEmail } from "@/lib/admin/config";

export const runtime = "nodejs";

/**
 * GET /admin/auth/callback?code=XXX&next=/admin
 *
 * Endpoint al que redirige Supabase después de que el usuario clickea
 * el magic link en su correo. Intercambia el `code` por una sesión.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin";

  if (!code) {
    return NextResponse.redirect(`${origin}/admin/login?error=missing_code`);
  }

  let response = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    console.error("[auth callback]", error);
    return NextResponse.redirect(`${origin}/admin/login?error=invalid_code`);
  }

  // Verificar allowlist
  if (!isAdminEmail(data.user.email)) {
    // Cerrar sesión inmediatamente — el usuario logueó pero no tiene permiso
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/admin/login?error=unauthorized`);
  }

  return response;
}