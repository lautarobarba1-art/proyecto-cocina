import * as React from "react";

/**
 * FormErrorBanner — banner de error de formulario, repetido antes
 * con clases rojas crudas en ClaseFormCliente/EventoFormCliente.
 */

export function FormErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-rojo/30 bg-rojo/5 px-4 py-3 text-[0.85rem] text-rojo">
      {children}
    </div>
  );
}
