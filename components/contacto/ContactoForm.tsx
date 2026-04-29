"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";

export interface ContactoFormProps {
  className?: string;
}

type FieldErrors = Partial<Record<"nombre" | "email" | "mensaje", boolean>>;

function validate(nombre: string, email: string, mensaje: string): FieldErrors {
  const e: FieldErrors = {};
  if (!nombre.trim()) e.nombre = true;
  if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = true;
  if (!mensaje.trim() || mensaje.trim().length < 8) e.mensaje = true;
  return e;
}

const inputBase =
  "w-full border-0 border-b bg-transparent py-2.5 font-body text-[0.95rem] text-carbon outline-none transition-[border-color] duration-300 ease-snap";
const inputNormal = "border-carbon/15 focus:border-terracota";
const inputError = "border-terracota-deep/50 focus:border-terracota-deep";

export function ContactoForm({ className }: ContactoFormProps) {
  const [nombre, setNombre] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [mensaje, setMensaje] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [errors, setErrors] = React.useState<FieldErrors>({});

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const next = validate(nombre, email, mensaje);
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
    <div className={["relative min-h-[280px]", className ?? ""].join(" ")}>
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
              <label htmlFor="ct-nombre" className="block font-mono text-[0.6rem] font-medium uppercase tracking-[0.2em] text-carbon/45">
                Nombre
              </label>
              <input
                id="ct-nombre"
                name="nombre"
                autoComplete="name"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  if (submitted) setErrors(validate(e.target.value, email, mensaje));
                }}
                className={fieldClass("nombre")}
              />
            </div>

            <div>
              <label htmlFor="ct-email" className="block font-mono text-[0.6rem] font-medium uppercase tracking-[0.2em] text-carbon/45">
                Email
              </label>
              <input
                id="ct-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (submitted) setErrors(validate(nombre, e.target.value, mensaje));
                }}
                className={fieldClass("email")}
              />
            </div>

            <div>
              <label htmlFor="ct-mensaje" className="block font-mono text-[0.6rem] font-medium uppercase tracking-[0.2em] text-carbon/45">
                Mensaje
              </label>
              <textarea
                id="ct-mensaje"
                name="mensaje"
                rows={5}
                value={mensaje}
                onChange={(e) => {
                  setMensaje(e.target.value);
                  if (submitted) setErrors(validate(nombre, email, e.target.value));
                }}
                className={[
                  "w-full resize-y min-h-[140px] border-0 border-b bg-transparent py-2.5 font-body text-[0.95rem] text-carbon outline-none transition-[border-color] duration-300 ease-snap",
                  errors.mensaje && submitted ? inputError : inputNormal,
                ].join(" ")}
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="group inline-flex items-baseline gap-2 rounded-full border border-carbon/20 bg-transparent px-1 py-2 font-mono text-[0.7rem] font-medium uppercase tracking-[0.22em] text-carbon transition-[border-color,color] duration-300 ease-snap hover:border-terracota hover:text-terracota disabled:opacity-50"
              >
                <span>Enviar mensaje</span>
                <span className="text-terracota transition-transform duration-300 ease-snap group-hover:translate-x-0.5">
                  →
                </span>
              </button>
            </div>
          </motion.form>
        ) : (
          <motion.div
            key="success"
            role="status"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="max-w-[32ch] pt-4"
          >
            <p className="font-display text-[clamp(1.5rem,2.8vw,2rem)] font-normal leading-[1.35] tracking-tightish text-carbon">
              Gracias. Nos pondremos en contacto pronto para empezar a crear.
            </p>
            <button
              type="button"
              onClick={() => {
                setSuccess(false);
                setSubmitted(false);
                setErrors({});
                setNombre("");
                setEmail("");
                setMensaje("");
              }}
              className="mt-10 font-mono text-[0.65rem] font-medium uppercase tracking-eyebrow text-terracota underline decoration-terracota/35 underline-offset-4 transition-colors hover:text-terracota-deep"
            >
              Enviar otro mensaje
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
