"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Button } from "@/components/ui/Button";
import {
  Field,
  FormGroup,
  FormInput,
  FormTextarea,
} from "@/components/ui/form";

export interface EspacioAlquilerFormProps {
  className?: string;
}

type FieldErrors = Partial<Record<"marca" | "fecha" | "mensaje", string>>;

function validate(marca: string, fecha: string, mensaje: string): FieldErrors {
  const e: FieldErrors = {};
  if (!marca.trim()) e.marca = "Requerido";
  if (!fecha.trim()) e.fecha = "Requerida";
  if (!mensaje.trim() || mensaje.trim().length < 8)
    e.mensaje = "Mínimo 8 caracteres";
  return e;
}

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

  return (
    <section className={className ?? ""} aria-labelledby="espacio-consulta-heading">
      <p
        id="espacio-consulta-heading"
        className="font-mono text-[0.65rem] font-medium uppercase tracking-eyebrow text-terracota"
      >
        Consulta por alquiler
      </p>
      <p className="mt-3 max-w-[48ch] font-body text-[0.9rem] leading-relaxed text-carbon/65">
        Contanos marca o proyecto, fecha tentativa y qué necesitás rodar.
        Respondemos con disponibilidad y condiciones (simulación en navegador).
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
            >
              <FormGroup>
                <Field
                  id="alq-marca"
                  label="Nombre de la marca / proyecto"
                  error={submitted ? errors.marca : undefined}
                >
                  <FormInput
                    name="marca"
                    autoComplete="organization"
                    value={marca}
                    onChange={(e) => {
                      setMarca(e.target.value);
                      if (submitted)
                        setErrors(validate(e.target.value, fecha, mensaje));
                    }}
                  />
                </Field>

                <Field
                  id="alq-fecha"
                  label="Fecha"
                  error={submitted ? errors.fecha : undefined}
                >
                  {/*
                    scheme-light: fuerza el picker de fecha al tema claro
                    independientemente del modo del sistema operativo.
                  */}
                  <FormInput
                    name="fecha"
                    type="date"
                    value={fecha}
                    onChange={(e) => {
                      setFecha(e.target.value);
                      if (submitted)
                        setErrors(validate(marca, e.target.value, mensaje));
                    }}
                    className="min-h-11 cursor-pointer scheme-light"
                  />
                </Field>

                <Field
                  id="alq-mensaje"
                  label="Mensaje"
                  error={submitted ? errors.mensaje : undefined}
                >
                  <FormTextarea
                    name="mensaje"
                    rows={4}
                    value={mensaje}
                    onChange={(e) => {
                      setMensaje(e.target.value);
                      if (submitted)
                        setErrors(validate(marca, fecha, e.target.value));
                    }}
                    className="min-h-[120px]"
                  />
                </Field>

                <div className="pt-1">
                  <Button type="submit" variant="primary" disabled={loading}>
                    Enviar consulta
                  </Button>
                </div>
              </FormGroup>
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
                Recibimos tu consulta. Te respondemos con disponibilidad y plano
                de trabajo.
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-8"
                onClick={() => {
                  setSuccess(false);
                  setSubmitted(false);
                  setErrors({});
                  setMarca("");
                  setFecha("");
                  setMensaje("");
                }}
              >
                Nueva consulta
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
