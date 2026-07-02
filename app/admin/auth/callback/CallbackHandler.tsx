"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isAdminEmail } from "@/lib/admin/config";

export function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    const code = searchParams.get("code");
    const rawNext = searchParams.get("next") ?? "/admin";
    const next = rawNext.startsWith("/admin") ? rawNext : "/admin";

    if (!code) {
      router.replace("/admin/login?error=missing_code");
      return;
    }

    const supabase = createSupabaseBrowserClient();

    supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
      if (error || !data.user) {
        console.error("[auth callback]", error);
        router.replace("/admin/login?error=invalid_code");
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

  return (
    <p className="mt-8 font-body text-[0.85rem] text-carbon/50">
      Verificando acceso…
    </p>
  );
}
