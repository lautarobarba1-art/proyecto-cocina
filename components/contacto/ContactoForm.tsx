"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Button } from "@/components/ui/Button";
import { HoneypotField } from "@/components/ui/HoneypotField";
import {
  Field,
  FormGroup,
  FormInput,
  FormTextarea,
} from "@/components/ui/form";
import { submitInquiry } from "@/lib/inquiries/submit";

export interface ContactoFormProps {
  className?: string;
}

type FieldErrors = Partial<Record<"nombre" | "email" | "mensaje", string>>;

function validate(nombre: string, email: string, mensaje: string): FieldErrors {
  const e: FieldErrors = {};
  if (!nombre.trim()) e.nombre = "Requerido";
  if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    e.email = "Correo inválido";
  if (!mensaje.trim() || mensaje.trim().length < 8)
    e.mensaje = "Mínimo 8 caracteres";
  return e;
}

export function ContactoForm({ className }: ContactoFormProps) {
  const [nombre, setNombre] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [mensaje, setMensaje] = React.useState("");
  const [honeypot, setHoneypot] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [serverError, setServerError] = React.useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setServerError(null);
    const next = validate(nombre, email, mensaje);
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    const result = await submitInquiry({
      type: "contact",
      name: nombre.trim(),
      email: email.trim(),
      mensaje: mensaje.trim(),
      honeypot,
    });
    setLoading(false);

    if (result.ok) {
      setSuccess(true);
      return;
    }
    setServerError(result.userMessage);
  };

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
          >
            <HoneypotField value={honeypot} onChange={setHoneypot} />
            <FormGroup>
              <Field
                id="ct-nombre"
                label="Nombre"
                error={submitted ? errors.nombre : undefined}
              >
                <FormInput
                  name="nombre"
                  autoComplete="name"
                  value={nombre}
                  onChange={(e) => {
                    setNombre(e.target.value);
                    if (submitted)
                      setErrors(validate(e.target.value, email, mensaje));
                  }}
                />
              </Field>

              <Field
                id="ct-email"
                label="Email"
                error={submitted ? errors.email : undefined}
              >
                <FormInput
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (submitted)
                      setErrors(validate(nombre, e.target.value, mensaje));
                  }}
                />
              </Field>

              <Field
                id="ct-mensaje"
                label="Mensaje"
                error={submitted ? errors.mensaje : undefined}
              >
                <FormTextarea
                  name="mensaje"
                  rows={5}
                  value={mensaje}
                  onChange={(e) => {
                    setMensaje(e.target.value);
                    if (submitted)
                      setErrors(validate(nombre, email, e.target.value));
                  }}
                  className="min-h-[140px]"
                />
              </Field>

              {serverError ? (
                <p className="font-sans text-[11px] font-medium text-rojo" role="alert" aria-live="polite">
                  {serverError}
                </p>
              ) : null}

              <div className="pt-2">
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? "Enviando…" : "Enviar mensaje"}
                </Button>
              </div>
            </FormGroup>
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
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-10"
              onClick={() => {
                setSuccess(false);
                setSubmitted(false);
                setErrors({});
                setServerError(null);
                setNombre("");
                setEmail("");
                setMensaje("");
                setHoneypot("");
              }}
            >
              Enviar otro mensaje
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
