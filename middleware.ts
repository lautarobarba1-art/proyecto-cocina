import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAdminEmail } from "@/lib/admin/config";

/**
 * Middleware que protege todas las rutas /admin/* excepto /admin/login y
 * /admin/auth/callback. Verifica:
 *   1. Que haya sesión activa en Supabase.
 *   2. Que el email del usuario esté en la allowlist.
 *
 * Si falla cualquier check → redirige a /admin/login.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Las dos rutas públicas dentro de /admin
  if (
    pathname === "/admin/login" ||
    pathname.startsWith("/admin/auth/callback")
  ) {
    return NextResponse.next();
  }

  // Solo proteger /admin/* (el resto del sitio sigue público)
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Crear response que el supabase client pueda mutar (cookies)
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data } = await supabase.auth.getUser();
  const email = data.user?.email ?? null;

  if (!email || !isAdminEmail(email)) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};