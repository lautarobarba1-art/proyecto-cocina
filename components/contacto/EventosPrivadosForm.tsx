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

export interface EventosPrivadosFormProps {
  className?: string;
}

type FieldErrors = Partial<
  Record<"nombre" | "email" | "fecha" | "mensaje", string>
>;

function validate(
  nombre: string,
  email: string,
  fecha: string,
  mensaje: string,
): FieldErrors {
  const e: FieldErrors = {};
  if (!nombre.trim()) e.nombre = "Requerido";
  if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    e.email = "Correo inválido";
  if (!fecha.trim()) e.fecha = "Requerida";
  if (!mensaje.trim() || mensaje.trim().length < 8)
    e.mensaje = "Mínimo 8 caracteres";
  return e;
}

export function EventosPrivadosForm({ className }: EventosPrivadosFormProps) {
  const [nombre, setNombre] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [fecha, setFecha] = React.useState("");
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
    const next = validate(nombre, email, fecha, mensaje);
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    const result = await submitInquiry({
      type: "eventos",
      name: nombre.trim(),
      email: email.trim(),
      fecha: fecha.trim(),
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
    <div className={["relative min-h-[320px]", className ?? ""].join(" ")}>
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
                id="eventos-nombre"
                label="Nombre"
                error={submitted ? errors.nombre : undefined}
              >
                <FormInput
                  name="nombre"
                  autoComplete="name"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </Field>

              <Field
                id="eventos-email"
                label="Email"
                error={submitted ? errors.email : undefined}
              >
                <FormInput
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>

              <Field
                id="eventos-fecha"
                label="Fecha tentativa"
                error={submitted ? errors.fecha : undefined}
              >
                <FormInput
                  name="fecha"
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="min-h-11 cursor-pointer scheme-light"
                />
              </Field>

              <Field
                id="eventos-mensaje"
                label="Contanos tu evento"
                error={submitted ? errors.mensaje : undefined}
              >
                <FormTextarea
                  name="mensaje"
                  rows={5}
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  className="min-h-[120px]"
                />
              </Field>
            </FormGroup>

            {serverError ? (
              <p className="mt-4 font-body text-[0.85rem] text-terracota" role="alert">
                {serverError}
              </p>
            ) : null}

            <div className="mt-8">
              <Button type="submit" variant="sketch" disabled={loading}>
                {loading ? "Enviando…" : "Enviar consulta"}
              </Button>
            </div>
          </motion.form>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="py-6"
          >
            <p className="font-display text-2xl text-carbon">Gracias.</p>
            <p className="mt-3 max-w-[36ch] font-body text-[0.95rem] leading-relaxed text-carbon/65">
              Recibimos tu consulta de evento privado. Te vamos a escribir a la brevedad para
              coordinar detalles.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
