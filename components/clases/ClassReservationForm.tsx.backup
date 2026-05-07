"use client";

import * as React from "react";

import { Button } from "@/components/ui/Button";
import {
  Field,
  FormError,
  FormGroup,
  FormInput,
  FormSelect,
  FormTextarea,
} from "@/components/ui/form";
import type { ClassMock } from "@/lib/classes-mock";
import { DEFAULT_CLASS_SESSIONS } from "@/lib/classes-mock";

export interface ClassReservationFormProps {
  classItem: ClassMock;
  className?: string;
}

export function ClassReservationForm({
  classItem,
  className,
}: ClassReservationFormProps) {
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
    if (notasScrollTimeoutRef.current != null)
      window.clearTimeout(notasScrollTimeoutRef.current);
    notasScrollTimeoutRef.current = window.setTimeout(() => {
      submitRef.current?.scrollIntoView({
        block: "center",
        behavior: "smooth",
        inline: "nearest",
      });
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
      if (notasScrollTimeoutRef.current != null)
        window.clearTimeout(notasScrollTimeoutRef.current);
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

  const cardClass = [
    "border border-carbon/10 bg-crema-light p-8 lg:p-10",
    "shadow-brand-lg",
    className ?? "",
  ].join(" ");

  if (success) {
    return (
      <div className={cardClass}>
        <p className="font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow text-terracota">
          {waitlist ? "Lista de espera" : "Reserva"}
        </p>
        <h3 className="mt-4 font-display text-2xl font-normal tracking-tightish text-carbon">
          {waitlist ? "Te sumamos a la lista" : "Listo, recibimos tu pedido"}
        </h3>
        <p className="mt-4 font-body text-[0.95rem] leading-relaxed text-carbon/75">
          {waitlist
            ? "Cuando haya cupos te escribimos a " + email.trim() + "."
            : "Te enviamos un correo a " +
              email.trim() +
              " con los próximos pasos y el medio de pago (mock — sin envío real)."}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="mt-8"
          onClick={() => {
            setSuccess(false);
            setNombre("");
            setEmail("");
            setTelefono("");
            setSessionId(sessions[0]?.id ?? "");
            setCupos("1");
            setMensaje("");
          }}
        >
          Enviar otro
        </Button>
      </div>
    );
  }

  return (
    <div className={cardClass}>
      <p className="font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow text-terracota">
        {waitlist ? "Lista de espera" : "Reservar lugar"}
      </p>
      <h3 className="mt-3 font-display text-2xl font-normal tracking-tightish text-carbon">
        {classItem.title}
      </h3>
      <p className="mt-2 font-body text-[0.9rem] text-carbon/65">
        {waitlist
          ? "Dejá tus datos y te avisamos si se libera un cupo."
          : "Completá el formulario; confirmamos disponibilidad en 24–48 h."}
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-8 pb-[max(7rem,env(safe-area-inset-bottom,0px))] sm:pb-0"
      >
        <FormGroup>
          <Field id="res-nombre" label="Nombre y apellido">
            <FormInput
              name="nombre"
              autoComplete="name"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </Field>

          <Field id="res-email" label="Correo">
            <FormInput
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>

          <Field
            id="res-tel"
            label={
              <>
                WhatsApp{" "}
                <span className="font-sans normal-case tracking-normal text-[11px] font-normal text-carbon/40">
                  (opcional)
                </span>
              </>
            }
          >
            <FormInput
              name="telefono"
              type="tel"
              autoComplete="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
          </Field>

          {!waitlist && sessions.length > 0 ? (
            <Field id="res-turno" label="Turno">
              <FormSelect
                name="sessionId"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </FormSelect>
            </Field>
          ) : null}

          {!waitlist ? (
            <Field id="res-cupos" label="Cupos">
              <FormSelect
                name="cupos"
                value={cupos}
                onChange={(e) => setCupos(e.target.value)}
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={String(n)}>
                    {n} {n === 1 ? "persona" : "personas"}
                  </option>
                ))}
              </FormSelect>
            </Field>
          ) : null}

          <Field
            id="res-msg"
            label={
              <>
                Notas{" "}
                <span className="font-sans normal-case tracking-normal text-[11px] font-normal text-carbon/40">
                  (opcional)
                </span>
              </>
            }
          >
            <FormTextarea
              name="mensaje"
              rows={3}
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              onFocus={onNotasFocus}
              onBlur={onNotasBlur}
              enterKeyHint="done"
              className="min-h-[80px]"
            />
          </Field>

          {error ? <FormError>{error}</FormError> : null}

          <Button
            ref={submitRef}
            type="submit"
            variant="primary"
            size="default"
            disabled={loading}
            className="mt-2 w-full scroll-mt-6"
          >
            {loading
              ? "Enviando…"
              : waitlist
                ? "Unirme a la lista"
                : "Solicitar reserva"}
          </Button>

          <p className="font-body text-[0.72rem] leading-relaxed text-carbon/45">
            Este envío es una simulación en el navegador; no se guardan datos en
            servidor.
          </p>
        </FormGroup>
      </form>
    </div>
  );
}
