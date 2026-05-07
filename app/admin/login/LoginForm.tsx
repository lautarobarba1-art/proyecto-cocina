"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  Field,
  FormError,
  FormGroup,
  FormInput,
} from "@/components/ui/form";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/admin";

  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Ingresá tu correo.");
      return;
    }

    setLoading(true);

    const supabase = createSupabaseBrowserClient();

    // URL absoluta a la que Supabase redirige tras el click en el magic link
    const callbackUrl = new URL("/admin/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", redirectTo);

    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: callbackUrl.toString(),
        shouldCreateUser: true,
      },
    });

    setLoading(false);

    if (authError) {
      console.error(authError);
      setError("No pudimos enviar el enlace. Probá de nuevo.");
      return;
    }

    setSent(true);
  };

  if (sent) {
    return (
      <div className="mt-8">
        <p className="font-body text-[0.95rem] leading-relaxed text-carbon/85">
          Revisá tu casilla. Te enviamos un enlace a{" "}
          <strong>{email.trim()}</strong> para acceder al panel.
        </p>
        <p className="mt-4 font-body text-[0.8rem] text-carbon/55">
          El enlace expira en una hora. Si no lo encontrás, mirá en spam.
        </p>
      </div>
    );
  }

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
        {error ? <FormError>{error}</FormError> : null}
        <Button
          type="submit"
          variant="primary"
          size="default"
          disabled={loading}
          className="mt-2 w-full"
        >
          {loading ? "Enviando…" : "Enviar enlace"}
        </Button>
      </FormGroup>
    </form>
  );
}