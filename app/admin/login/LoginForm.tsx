"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  Field,
  FormError,
  FormGroup,
  FormInput,
} from "@/components/ui/form";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isAdminEmail } from "@/lib/admin/config";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/admin";
  const safeRedirect = redirectTo.startsWith("/admin") ? redirectTo : "/admin";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Ingresá tu correo y contraseña.");
      return;
    }

    setLoading(true);

    const supabase = createSupabaseBrowserClient();

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError || !data.user) {
      setLoading(false);
      setError("Correo o contraseña incorrectos.");
      return;
    }

    if (!isAdminEmail(data.user.email)) {
      await supabase.auth.signOut();
      setLoading(false);
      setError("Este correo no tiene acceso al panel.");
      return;
    }

    router.push(safeRedirect);
  };

  return (
    <form onSubmit={onSubmit} className="mt-8">
      <FormGroup>
        <Field id="admin-email" label="Correo">
          <FormInput
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </Field>
        <Field id="admin-password" label="Contraseña">
          <FormInput
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </Field>
        {error ? <FormError>{error}</FormError> : null}
        <Button
          type="submit"
          variant="primary"
          size="default"
          disabled={loading}
          className="mt-2 w-full"
        >
          {loading ? "Ingresando…" : "Ingresar"}
        </Button>
      </FormGroup>
    </form>
  );
}
