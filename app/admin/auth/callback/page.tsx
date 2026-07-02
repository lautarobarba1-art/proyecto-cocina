import { Suspense } from "react";
import { CallbackHandler } from "./CallbackHandler";

export default function AuthCallbackPage() {
  return (
    <main className="fixed inset-0 z-9999 flex items-center justify-center overflow-y-auto bg-crema-light p-6">
      <div className="w-full max-w-md border border-carbon/10 bg-white p-8 lg:p-10 shadow-brand-lg">
        <p className="font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow text-terracota">
          Panel admin
        </p>
        <h1 className="mt-4 font-display text-2xl font-normal tracking-tightish text-carbon">
          Acceso a Menesteres
        </h1>
        <Suspense
          fallback={
            <p className="mt-8 font-body text-[0.85rem] text-carbon/50">
              Verificando acceso…
            </p>
          }
        >
          <CallbackHandler />
        </Suspense>
      </div>
    </main>
  );
}
