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
import { whatsappHref } from "@/lib/site/contact";

export interface SessionOption {
  id: string;
  label: string;
  classId?: string;
  date?: string;
}

export interface ClassReservationFormProps {
  classItem: ClassMock;
  className?: string;
  sessions?: SessionOption[];
  initialSessionId?: string;
}

export function ClassReservationForm({
  classItem,
  className,
  sessions: sessionsProp,
  initialSessionId,
}: ClassReservationFormProps) {
  const soldOut = classItem.status === "agotado";
  const waitlist = soldOut;

  // Si vienen sessions por prop, las usamos. Si no, fallback al mock.
  const sessions: SessionOption[] = waitlist
    ? []
    : sessionsProp && sessionsProp.length > 0
      ? sessionsProp
      : DEFAULT_CLASS_SESSIONS;

  const [nombre, setNombre] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [telefono, setTelefono] = React.useState("");
  const [sessionId, setSessionId] = React.useState(
    initialSessionId ?? sessions[0]?.id ?? "",
  );
  const [cupos, setCupos] = React.useState("1");
  const [mensaje, setMensaje] = React.useState("");
  const [honeypot, setHoneypot] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // idempotency key generada al montar el form
  const idempotencyKeyRef = React.useRef<string>("");
  React.useEffect(() => {
    idempotencyKeyRef.current = crypto.randomUUID();
  }, []);

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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nombre.trim() || !email.trim()) {
      setError("Completá nombre y correo.");
      return;
    }

    if (!waitlist && sessions.length === 0) {
      setError("No hay sesiones disponibles para reservar en este momento.");
      return;
    }
    if (!waitlist && !sessionId) {
      setError("Elegí un turno.");
      return;
    }

    // waitlist nunca llega aquí — el soldOut card se muestra antes del form

    // Buscar el classId real de la sesión elegida
    const selected = sessions.find((s) => s.id === sessionId);
    const classId = selected?.classId ?? selected?.id;

    if (!classId) {
      setError("No se pudo identificar la sesión.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId,
          name: nombre.trim(),
          email: email.trim(),
          phone: telefono.trim() || null,
          notes: mensaje.trim() || null,
          spots: parseInt(cupos, 10),
          idempotencyKey: idempotencyKeyRef.current,
          honeypot,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const code = json?.error;
        if (code === "no_spots") {
          setError("Ya no quedan cupos para esta sesión.");
        } else if (code === "cancelled") {
          setError("Esta sesión fue cancelada.");
        } else if (code === "invalid_email") {
          setError("Correo inválido.");
        } else if (code === "invalid_spots") {
          setError("Cantidad de cupos inválida.");
        } else {
          setError("No pudimos procesar tu reserva. Intentá de nuevo.");
        }
        setLoading(false);
        return;
      }

      setLoading(false);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError("Error de conexión. Probá de nuevo en un momento.");
      setLoading(false);
    }
  };

  const cardClass = [
    "border border-carbon/10 bg-crema-light p-8 lg:p-10",
    "shadow-brand-lg",
    className ?? "",
  ].join(" ");

  if (soldOut) {
    return (
      <div className={cardClass}>
        <p className="font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow text-terracota">
          Sin cupos
        </p>
        <h3 className="mt-4 font-display text-2xl font-normal tracking-tightish text-carbon">
          Esta clase está agotada
        </h3>
        <p className="mt-4 font-body text-[0.95rem] leading-relaxed text-carbon/75">
          Escribinos por WhatsApp y te avisamos si se libera un lugar o cuándo
          abre la próxima fecha.
        </p>
        <Button
          href={whatsappHref()}
          variant="primary"
          size="default"
          className="mt-8 w-full"
          external
        >
          Consultar por WhatsApp
        </Button>
      </div>
    );
  }

  if (success) {
    return (
      <div className={cardClass}>
        <p className="font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow text-terracota">
          Reserva
        </p>
        <h3 className="mt-4 font-display text-2xl font-normal tracking-tightish text-carbon">
          Listo, recibimos tu pedido
        </h3>
        <p className="mt-4 font-body text-[0.95rem] leading-relaxed text-carbon/75">
          Te enviamos un correo a {email.trim()} con los próximos pasos y el
          medio de pago.
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
            setSessionId(initialSessionId ?? sessions[0]?.id ?? "");
            setCupos("1");
            setMensaje("");
            idempotencyKeyRef.current = crypto.randomUUID();
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
          {/* Honeypot oculto: bots lo llenan, humanos no */}
          <div
            style={{
              position: "absolute",
              left: "-9999px",
              width: "1px",
              height: "1px",
              overflow: "hidden",
            }}
            aria-hidden="true"
          >
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

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
            Recibirás un correo con los próximos pasos.
          </p>
        </FormGroup>
      </form>
    </div>
  );
}
