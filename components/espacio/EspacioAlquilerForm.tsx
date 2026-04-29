"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";

export interface EspacioAlquilerFormProps {
  className?: string;
}

type FieldErrors = Partial<Record<"marca" | "fecha" | "mensaje", boolean>>;

function validate(marca: string, fecha: string, mensaje: string): FieldErrors {
  const e: FieldErrors = {};
  if (!marca.trim()) e.marca = true;
  if (!fecha.trim()) e.fecha = true;
  if (!mensaje.trim() || mensaje.trim().length < 8) e.mensaje = true;
  return e;
}

const inputBase =
  "w-full border-0 border-b bg-transparent py-2.5 font-body text-[0.95rem] text-carbon outline-none transition-[border-color] duration-300 ease-snap";
const inputNormal = "border-carbon/15 focus:border-terracota";
const inputError = "border-terracota-deep/50 focus:border-terracota-deep";

export function EspacioAlquilerForm({ className }: EspacioAlquilerFormProps) {
  const [marca, setMarca] = React.useState("");
  const [fecha, setFecha] = React.useState("");
  const [mensaje, setMensaje] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [errors, setErrors] = React.useState<FieldErrors>({});

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const next = validate(marca, fecha, mensaje);
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 750);
  };

  const fieldClass = (key: keyof FieldErrors) =>
    [inputBase, errors[key] && submitted ? inputError : inputNormal].join(" ");

  return (
    <section className={className ?? ""} aria-labelledby="espacio-consulta-heading">
      <h2 id="espacio-consulta-heading" className="font-mono text-[0.65rem] font-medium uppercase tracking-eyebrow text-terracota">
        Consulta por alquiler
      </h2>
      <p className="mt-3 max-w-[48ch] font-body text-[0.9rem] leading-relaxed text-carbon/65">
        Contanos marca o proyecto, fecha tentativa y qué necesitás rodar. Respondemos con disponibilidad y
        condiciones (simulación en navegador).
      </p>

      <div className="relative mt-10 min-h-[260px] max-w-md">
        <AnimatePresence mode="wait">
          {!success ? (
            <motion.form
              key="form"
              onSubmit={onSubmit}
              noValidate
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              className="grid gap-8"
            >
              <div>
                <label htmlFor="alq-marca" className="block font-mono text-[0.6rem] font-medium uppercase tracking-[0.2em] text-carbon/45">
                  Nombre de la marca / proyecto
                </label>
                <input
                  id="alq-marca"
                  name="marca"
                  autoComplete="organization"
                  value={marca}
                  onChange={(e) => {
                    setMarca(e.target.value);
                    if (submitted) setErrors(validate(e.target.value, fecha, mensaje));
                  }}
                  className={fieldClass("marca")}
                />
              </div>
              <div>
                <label htmlFor="alq-fecha" className="block font-mono text-[0.6rem] font-medium uppercase tracking-[0.2em] text-carbon/45">
                  Fecha
                </label>
                <input
                  id="alq-fecha"
                  name="fecha"
                  type="date"
                  value={fecha}
                  onChange={(e) => {
                    setFecha(e.target.value);
                    if (submitted) setErrors(validate(marca, e.target.value, mensaje));
                  }}
                  className={[
                    fieldClass("fecha"),
                    "min-h-11 cursor-pointer scheme-light",
                  ].join(" ")}
                />
              </div>
              <div>
                <label htmlFor="alq-mensaje" className="block font-mono text-[0.6rem] font-medium uppercase tracking-[0.2em] text-carbon/45">
                  Mensaje
                </label>
                <textarea
                  id="alq-mensaje"
                  name="mensaje"
                  rows={4}
                  value={mensaje}
                  onChange={(e) => {
                    setMensaje(e.target.value);
                    if (submitted) setErrors(validate(marca, fecha, e.target.value));
                  }}
                  className={[
                    "w-full resize-y min-h-[120px] border-0 border-b bg-transparent py-2.5 font-body text-[0.95rem] text-carbon outline-none transition-[border-color] duration-300 ease-snap",
                    errors.mensaje && submitted ? inputError : inputNormal,
                  ].join(" ")}
                />
              </div>
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="group inline-flex items-baseline gap-2 rounded-full border border-carbon/20 bg-transparent px-1 py-2 font-mono text-[0.7rem] font-medium uppercase tracking-[0.22em] text-carbon transition-[border-color,color] duration-300 ease-snap hover:border-terracota hover:text-terracota disabled:opacity-50"
                >
                  <span>Enviar consulta</span>
                  <span className="text-terracota transition-transform duration-300 ease-snap group-hover:translate-x-0.5">
                    →
                  </span>
                </button>
              </div>
            </motion.form>
          ) : (
            <motion.div
              key="ok"
              role="status"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="max-w-[30ch]"
            >
              <p className="font-display text-[clamp(1.35rem,2.4vw,1.75rem)] font-normal leading-snug tracking-tightish text-carbon">
                Recibimos tu consulta. Te respondemos con disponibilidad y plano de trabajo.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSuccess(false);
                  setSubmitted(false);
                  setErrors({});
                  setMarca("");
                  setFecha("");
                  setMensaje("");
                }}
                className="mt-8 font-mono text-[0.65rem] font-medium uppercase tracking-eyebrow text-terracota underline decoration-terracota/35 underline-offset-4 hover:text-terracota-deep"
              >
                Nueva consulta
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
