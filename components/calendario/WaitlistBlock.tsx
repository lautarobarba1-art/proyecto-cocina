"use client";

import * as React from "react";
import Link from "next/link";

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
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 font-mono text-xl leading-none text-crema/50 transition-opacity hover:opacity-100"
        aria-label="Cerrar"
      >
        ×
      </button>
      <p className="font-display text-[1.5rem] font-normal italic text-crema">Esta clase está completa.</p>
      <p className="mt-4 max-w-[48ch] font-display text-[1rem] leading-relaxed text-crema/85">
        Sumate a la lista de espera. Si alguien libera lugar, te avisamos primero.
      </p>
      {sent ? (
        <p className="mt-8 font-mono text-[11px] uppercase tracking-meta text-terracota-soft">Listo — te avisamos por correo (mock).</p>
      ) : (
        <form
          className="mt-8 grid max-w-md gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
        >
          <div>
            <label htmlFor="wl-n" className="font-mono text-[10px] uppercase tracking-meta text-crema/55">
              Nombre
            </label>
            <input
              id="wl-n"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="mt-2 w-full border-0 border-b border-crema/30 bg-transparent py-2 font-body text-[0.95rem] text-crema outline-none focus:border-terracota-soft"
            />
          </div>
          <div>
            <label htmlFor="wl-e" className="font-mono text-[10px] uppercase tracking-meta text-crema/55">
              Email
            </label>
            <input
              id="wl-e"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full border-0 border-b border-crema/30 bg-transparent py-2 font-body text-[0.95rem] text-crema outline-none focus:border-terracota-soft"
            />
          </div>
          <button
            type="submit"
            className="w-full max-w-xs border border-terracota-soft bg-terracota-soft px-6 py-3 font-mono text-[10px] font-medium uppercase tracking-meta text-carbon transition-opacity hover:opacity-90"
          >
            Avisame ←→
          </button>
        </form>
      )}
      <p className="mt-8">
        <Link
          href={`/clases?cat=${event.category === "eventos" ? "adultos" : event.category}`}
          className="font-mono text-[10px] uppercase tracking-meta text-crema/60 underline decoration-crema/25 underline-offset-4 hover:text-terracota-soft"
        >
          Ver próximas fechas similares →
        </Link>
      </p>
    </div>
  );
}
