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
import { mailtoHref } from "@/lib/site/contact";

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
  const [reservationId, setReservationId] = React.useState<string | null>(null);
  const [comprobante, setComprobante] = React.useState<File | null>(null);
  const [comprobanteLoading, setComprobanteLoading] = React.useState(false);
  const [comprobanteSuccess, setComprobanteSuccess] = React.useState(false);
  const [comprobanteError, setComprobanteError] = React.useState<string | null>(null);
  const successRef = React.useRef<HTMLDivElement>(null);

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

  React.useEffect(() => {
    if (!success || !successRef.current) return;
    successRef.current.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });
  }, [success]);

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
        if (code === "not_available") {
          setError("Ya no quedan cupos para esta sesión.");
        } else if (code === "cancelled") {
          setError("Esta sesión fue cancelada.");
        } else if (code === "duplicate") {
          setError("Ya tenés una reserva registrada para esta sesión.");
        } else {
          setError("No pudimos procesar tu reserva. Intentá de nuevo.");
        }
        setLoading(false);
        return;
      }

      setLoading(false);
      setSuccess(true);
      setReservationId(json?.id ?? null);
    } catch (err) {
      console.error(err);
      setError("Error de conexión. Probá de nuevo en un momento.");
      setLoading(false);
    }
  };

  const onUploadComprobante = async () => {
    if (!comprobante || !reservationId) return;
    if (comprobante.size > 4 * 1024 * 1024) {
      setComprobanteError("El archivo supera el límite de 4 MB.");
      return;
    }
    setComprobanteLoading(true);
    setComprobanteError(null);
    try {
      const fd = new FormData();
      fd.append("comprobante", comprobante);
      const res = await fetch(`/api/reservations/${reservationId}/comprobante`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        const code = json?.error;
        if (code === "file_too_large") {
          setComprobanteError("El archivo supera el límite de 4 MB.");
        } else if (code === "invalid_file_type") {
          setComprobanteError("Formato no soportado. Usá JPG, PNG, WEBP o PDF.");
        } else {
          setComprobanteError("No pudimos enviar el comprobante. Intentá de nuevo.");
        }
        return;
      }
      setComprobanteSuccess(true);
    } catch {
      setComprobanteError("Error de conexión. Probá de nuevo.");
    } finally {
      setComprobanteLoading(false);
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
          Escribinos por email y te avisamos si se libera un lugar o cuándo
          abre la próxima fecha.
        </p>
        <Button
          href={mailtoHref()}
          variant="primary"
          size="default"
          className="mt-8 w-full"
          external
        >
          Consultar por email
        </Button>
      </div>
    );
  }

  if (success) {
    return (
      <div ref={successRef} className={cardClass}>
        <p className="font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow text-terracota">
          Reserva
        </p>
        <h3 className="mt-4 font-display text-2xl font-normal tracking-tightish text-carbon">
          Listo, tu reserva fue registrada
        </h3>
        <p className="mt-4 font-body text-[0.95rem] leading-relaxed text-carbon/75">
          Te enviamos por email los datos para realizar la transferencia y
          confirmar tu reserva. Si no recibís el correo en los próximos
          minutos, escribinos.
        </p>

        {/* Comprobante upload */}
        <div className="mt-8 border-t border-carbon/10 pt-6">
          <p className="font-sans text-[11px] font-bold uppercase tracking-meta text-carbon/55">
            Comprobante de pago
          </p>
          {comprobanteSuccess ? (
            <p className="mt-3 font-body text-[0.9rem] text-carbon/75">
              Comprobante recibido, lo revisamos a la brevedad.
            </p>
          ) : (
            <>
              <p className="mt-2 font-body text-[0.9rem] leading-relaxed text-carbon/65">
                Si ya realizaste la transferencia, podés adjuntar el comprobante
                y se lo hacemos llegar directamente.
              </p>
              <div className="mt-4 grid gap-4">
                <div>
                  <label
                    htmlFor="comprobante-file"
                    className="block font-sans text-[11px] font-bold uppercase tracking-meta text-carbon/55"
                  >
                    Adjuntar archivo
                    <span className="ml-1 normal-case font-normal tracking-normal text-carbon/35">
                      (JPG, PNG, PDF · máx. 4 MB)
                    </span>
                  </label>
                  <input
                    id="comprobante-file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="mt-2 w-full cursor-pointer font-sans text-[0.85rem] text-carbon/70 file:mr-3 file:cursor-pointer file:border file:border-carbon/20 file:bg-transparent file:px-3 file:py-1.5 file:font-sans file:text-[0.8rem] file:text-carbon/60"
                    onChange={(e) => {
                      setComprobante(e.target.files?.[0] ?? null);
                      setComprobanteError(null);
                    }}
                  />
                </div>
                {comprobanteError && (
                  <FormError>{comprobanteError}</FormError>
                )}
                <Button
                  type="button"
                  variant="primary"
                  size="default"
                  disabled={!comprobante || comprobanteLoading}
                  className="w-full"
                  onClick={onUploadComprobante}
                >
                  {comprobanteLoading ? "Enviando…" : "Enviar comprobante"}
                </Button>
              </div>
            </>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="mt-8"
          onClick={() => {
            setSuccess(false);
            setReservationId(null);
            setComprobante(null);
            setComprobanteLoading(false);
            setComprobanteSuccess(false);
            setComprobanteError(null);
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
            Recibirás un correo con los próximos pasos.{" "}
            Al reservar aceptás el tratamiento de tus datos según nuestra{" "}
            <a
              href="/politica-privacidad"
              className="underline decoration-carbon/25 underline-offset-2 hover:text-carbon/65"
            >
              Política de Privacidad
            </a>
            .
          </p>
        </FormGroup>
      </form>
    </div>
  );
}
