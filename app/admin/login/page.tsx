import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Acceso admin · Menesteres",
};

export default function AdminLoginPage() {
  return (
    <main className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-crema-light p-6">
      <div className="w-full max-w-md border border-carbon/10 bg-white p-8 lg:p-10 shadow-brand-lg">
        <p className="font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow text-terracota">
          Panel admin
        </p>
        <h1 className="mt-4 font-display text-2xl font-normal tracking-tightish text-carbon">
          Acceso a Menesteres
        </h1>
        <p className="mt-3 font-body text-[0.9rem] leading-relaxed text-carbon/65">
          Ingresá tu correo y te enviaremos un enlace de acceso.
        </p>

        <Suspense
          fallback={
            <p className="mt-8 font-body text-[0.85rem] text-carbon/50">
              Cargando…
            </p>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}