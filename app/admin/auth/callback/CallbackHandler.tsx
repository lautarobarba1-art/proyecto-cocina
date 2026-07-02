"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isAdminEmail } from "@/lib/admin/config";

export function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    const code = searchParams.get("code");
    const rawNext = searchParams.get("next") ?? "/admin";
    const next = rawNext.startsWith("/admin") ? rawNext : "/admin";

    if (!code) {
      setErrorMsg("No se recibió el código de acceso (missing_code).");
      return;
    }

    const supabase = createSupabaseBrowserClient();

    supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
      if (error || !data.user) {
        setErrorMsg(error?.message ?? "Error desconocido al verificar el enlace.");
        return;
      }

      if (!isAdminEmail(data.user.email)) {
        supabase.auth.signOut().then(() => {
          router.replace("/admin/login?error=unauthorized");
        });
        return;
      }

      router.replace(next);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (errorMsg) {
    return (
      <div className="mt-8 space-y-3">
        <p className="font-body text-[0.85rem] text-red-600">
          Error al verificar el enlace:
        </p>
        <p className="font-mono text-[0.75rem] text-carbon/70 break-all">
          {errorMsg}
        </p>
        <a
          href="/admin/login"
          className="block font-body text-[0.85rem] text-terracota underline"
        >
          Volver y pedir un nuevo enlace
        </a>
      </div>
    );
  }

  return (
    <p className="mt-8 font-body text-[0.85rem] text-carbon/50">
      Verificando acceso…
    </p>
  );
}
