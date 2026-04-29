"use client";

import * as React from "react";

import type { ClassMock } from "@/lib/classes-mock";
import { DEFAULT_CLASS_SESSIONS } from "@/lib/classes-mock";

export interface ClassReservationFormProps {
  classItem: ClassMock;
  className?: string;
}

export function ClassReservationForm({ classItem, className }: ClassReservationFormProps) {
  const soldOut = classItem.status === "agotado";
  const waitlist = soldOut;
  const sessions = waitlist ? [] : DEFAULT_CLASS_SESSIONS;

  const [nombre, setNombre] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [telefono, setTelefono] = React.useState("");
  const [sessionId, setSessionId] = React.useState(sessions[0]?.id ?? "");
  const [cupos, setCupos] = React.useState("1");
  const [mensaje, setMensaje] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const submitRef = React.useRef<HTMLButtonElement>(null);
  const notasScrollTimeoutRef = React.useRef<number | null>(null);

  const onNotasFocus = React.useCallback(() => {
    if (notasScrollTimeoutRef.current != null) window.clearTimeout(notasScrollTimeoutRef.current);
    notasScrollTimeoutRef.current = window.setTimeout(() => {
      submitRef.current?.scrollIntoView({ block: "center", behavior: "smooth", inline: "nearest" });
    }, 280);
  }, []);

  const onNotasBlur = React.useCallback(() => {
    if (notasScrollTimeoutRef.current != null) {
      window.clearTimeout(notasScrollTimeoutRef.current);
      notasScrollTimeoutRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    return () => {
      if (notasScrollTimeoutRef.current != null) window.clearTimeout(notasScrollTimeoutRef.current);
    };
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!nombre.trim() || !email.trim()) {
      setError("Completá nombre y correo.");
      return;
    }
    if (!waitlist && sessions.length > 0 && !sessionId) {
      setError("Elegí un turno.");
      return;
    }
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 900);
  };

  if (success) {
    return (
      <div
        className={[
          "border border-carbon/10 bg-crema-light p-8 lg:p-10",
          "shadow-[var(--mn-shadow-deep)]",
          className ?? "",
        ].join(" ")}
      >
        <p className="font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow text-terracota">
          {waitlist ? "Lista de espera" : "Reserva"}
        </p>
        <h3 className="mt-4 font-display text-2xl font-normal tracking-tightish text-carbon">
          {waitlist ? "Te sumamos a la lista" : "Listo, recibimos tu pedido"}
        </h3>
        <p className="mt-4 font-body text-[0.95rem] leading-relaxed text-carbon/75">
          {waitlist
            ? "Cuando haya cupos te escribimos a " + email.trim() + "."
            : "Te enviamos un correo a " + email.trim() + " con los próximos pasos y el medio de pago (mock — sin envío real)."}
        </p>
        <button
          type="button"
          onClick={() => {
            setSuccess(false);
            setNombre("");
            setEmail("");
            setTelefono("");
            setSessionId(sessions[0]?.id ?? "");
            setCupos("1");
            setMensaje("");
          }}
          className="mt-8 font-mono text-[0.65rem] font-medium uppercase tracking-eyebrow text-terracota underline decoration-terracota/40 underline-offset-4 transition-colors hover:text-terracota-deep"
        >
          Enviar otro
        </button>
      </div>
    );
  }

  return (
    <div
      className={[
        "border border-carbon/10 bg-crema-light p-8 lg:p-10",
        "shadow-[var(--mn-shadow-deep)]",
        className ?? "",
      ].join(" ")}
    >
      <p className="font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow text-terracota">
        {waitlist ? "Lista de espera" : "Reservar lugar"}
      </p>
      <h3 className="mt-3 font-display text-2xl font-normal tracking-tightish text-carbon">{classItem.title}</h3>
      <p className="mt-2 font-body text-[0.9rem] text-carbon/65">
        {waitlist
          ? "Dejá tus datos y te avisamos si se libera un cupo."
          : "Completá el formulario; confirmamos disponibilidad en 24–48 h."}
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-8 grid gap-5 pb-[max(7rem,env(safe-area-inset-bottom,0px))] sm:pb-0"
      >
        <div>
          <label htmlFor="res-nombre" className="block font-mono text-[0.6rem] font-medium uppercase tracking-[0.18em] text-carbon/55">
            Nombre y apellido
          </label>
          <input
            id="res-nombre"
            name="nombre"
            autoComplete="name"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="mt-2 w-full border-b border-carbon/20 bg-transparent py-2 font-body text-[0.95rem] text-carbon outline-none transition-colors focus:border-terracota"
          />
        </div>
        <div>
          <label htmlFor="res-email" className="block font-mono text-[0.6rem] font-medium uppercase tracking-[0.18em] text-carbon/55">
            Correo
          </label>
          <input
            id="res-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full border-b border-carbon/20 bg-transparent py-2 font-body text-[0.95rem] text-carbon outline-none transition-colors focus:border-terracota"
          />
        </div>
        <div>
          <label htmlFor="res-tel" className="block font-mono text-[0.6rem] font-medium uppercase tracking-[0.18em] text-carbon/55">
            WhatsApp <span className="font-body normal-case tracking-normal text-carbon/40">(opcional)</span>
          </label>
          <input
            id="res-tel"
            name="telefono"
            type="tel"
            autoComplete="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className="mt-2 w-full border-b border-carbon/20 bg-transparent py-2 font-body text-[0.95rem] text-carbon outline-none transition-colors focus:border-terracota"
          />
        </div>

        {!waitlist && sessions.length > 0 ? (
          <div>
            <label htmlFor="res-turno" className="block font-mono text-[0.6rem] font-medium uppercase tracking-[0.18em] text-carbon/55">
              Turno
            </label>
            <select
              id="res-turno"
              name="sessionId"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="mt-2 w-full cursor-pointer border-b border-carbon/20 bg-transparent py-2 font-body text-[0.95rem] text-carbon outline-none transition-colors focus:border-terracota"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {!waitlist ? (
          <div>
            <label htmlFor="res-cupos" className="block font-mono text-[0.6rem] font-medium uppercase tracking-[0.18em] text-carbon/55">
              Cupos
            </label>
            <select
              id="res-cupos"
              name="cupos"
              value={cupos}
              onChange={(e) => setCupos(e.target.value)}
              className="mt-2 w-full cursor-pointer border-b border-carbon/20 bg-transparent py-2 font-body text-[0.95rem] text-carbon outline-none transition-colors focus:border-terracota"
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={String(n)}>
                  {n} {n === 1 ? "persona" : "personas"}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div>
          <label htmlFor="res-msg" className="block font-mono text-[0.6rem] font-medium uppercase tracking-[0.18em] text-carbon/55">
            Notas <span className="font-body normal-case tracking-normal text-carbon/40">(opcional)</span>
          </label>
          <textarea
            id="res-msg"
            name="mensaje"
            rows={3}
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            onFocus={onNotasFocus}
            onBlur={onNotasBlur}
            enterKeyHint="done"
            className="mt-2 w-full resize-y border border-carbon/15 bg-crema-deep/40 px-3 py-2 font-body text-[0.9rem] text-carbon outline-none transition-colors focus:border-terracota/50"
          />
        </div>

        {error ? <p className="font-body text-sm text-terracota">{error}</p> : null}

        <button
          ref={submitRef}
          type="submit"
          disabled={loading}
          className="mt-2 inline-flex w-full scroll-mt-6 items-center justify-center border border-carbon/20 bg-carbon px-6 py-3.5 font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow text-crema-light transition-colors duration-300 ease-snap hover:bg-carbon-soft disabled:opacity-60"
        >
          {loading ? "Enviando…" : waitlist ? "Unirme a la lista" : "Solicitar reserva"}
        </button>
        <p className="font-body text-[0.72rem] leading-relaxed text-carbon/45">
          Este envío es una simulación en el navegador; no se guardan datos en servidor.
        </p>
      </form>
    </div>
  );
}
