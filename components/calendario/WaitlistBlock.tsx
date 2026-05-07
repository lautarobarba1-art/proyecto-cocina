"use client";

import * as React from "react";

import { Button } from "@/components/ui/Button";
import { Field, FormGroup, FormInput } from "@/components/ui/form";
import type { ClassEvent } from "@/lib/calendar/types";

export interface WaitlistBlockProps {
  event: ClassEvent;
  onClose: () => void;
}

export function WaitlistBlock({ event, onClose }: WaitlistBlockProps) {
  const [nombre, setNombre] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [sent, setSent] = React.useState(false);

  return (
    <div className="relative mt-8 border-l-4 border-terracota-soft bg-carbon p-10 text-crema">
      {/*
        Botón de cierre: icono ×, no encaja en el patrón de <Button />.
        Queda como raw button para no perder el posicionamiento absoluto
        y el sizing puntual que requiere.
      */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 inline-flex min-h-[44px] min-w-[44px] items-center justify-center font-mono text-xl leading-none text-crema/50 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crema/30"
        aria-label="Cerrar"
      >
        ×
      </button>

      <p className="font-display text-[1.5rem] font-normal italic text-crema">
        Esta clase está completa.
      </p>
      <p className="mt-4 max-w-[48ch] font-display text-[1rem] leading-relaxed text-crema/85">
        Sumate a la lista de espera. Si alguien libera lugar, te avisamos
        primero.
      </p>

      {sent ? (
        <p className="mt-8 font-sans text-[11px] uppercase tracking-meta text-terracota-soft">
          Listo — te avisamos por correo (mock).
        </p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
        >
          <FormGroup className="mt-8 max-w-md">
            <Field id="wl-nombre" label="Nombre" onDark>
              <FormInput
                name="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                onDark
              />
            </Field>

            <Field id="wl-email" label="Email" onDark>
              <FormInput
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onDark
              />
            </Field>

            <div>
              <Button type="submit" variant="primary" className="w-full max-w-xs">
                Avisame
              </Button>
            </div>
          </FormGroup>
        </form>
      )}

      <p className="mt-8">
        <Button
          href={`/clases?cat=${event.category === "eventos" ? "adultos" : event.category}`}
          variant="ghost"
          size="sm"
          withArrow={true}
        >
          Ver próximas fechas similares
        </Button>
      </p>
    </div>
  );
}
