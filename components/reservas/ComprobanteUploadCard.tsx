"use client";
import * as React from "react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/form";

export interface ComprobanteUploadCardProps {
  reservationId: string;
  /** true si `comprobante_url` ya está seteado (subida previa, o venimos del mismo submit). */
  initialUploaded?: boolean;
}

/**
 * Widget de subida de comprobante, reusado tanto en la pantalla de éxito de
 * ClassReservationForm (justo después de reservar) como en la página
 * persistente /reservas/[id]/comprobante (para volver más tarde, ver
 * app/reservas/[id]/comprobante/page.tsx). Antes de esto solo existía la
 * primera vía: si el usuario cerraba esa pantalla sin subir el comprobante,
 * no tenía forma de volver a hacerlo.
 */
export function ComprobanteUploadCard({
  reservationId,
  initialUploaded = false,
}: ComprobanteUploadCardProps) {
  const [comprobante, setComprobante] = React.useState<File | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(initialUploaded);
  const [error, setError] = React.useState<string | null>(null);

  const onUpload = async () => {
    if (!comprobante) return;
    if (comprobante.size > 4 * 1024 * 1024) {
      setError("El archivo supera el límite de 4 MB.");
      return;
    }
    setLoading(true);
    setError(null);
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
          setError("El archivo supera el límite de 4 MB.");
        } else if (code === "invalid_file_type") {
          setError("Formato no soportado. Usá JPG, PNG, WEBP o PDF.");
        } else if (code === "comprobante_already_exists") {
          // Ya había uno subido (ej. otra pestaña) — no es un error real.
          setSuccess(true);
        } else if (code === "reservation_not_pending") {
          setError(
            "Esta reserva ya no está activa (fue cancelada o ya se confirmó el pago). Si creés que es un error, escribinos.",
          );
        } else {
          setError("No pudimos enviar el comprobante. Intentá de nuevo.");
        }
        return;
      }
      setSuccess(true);
    } catch {
      setError("Error de conexión. Probá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <p className="mt-3 font-body text-[0.9rem] text-carbon/75">
        Comprobante recibido, lo revisamos a la brevedad.
      </p>
    );
  }

  return (
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
            setError(null);
          }}
        />
      </div>
      {error && <FormError>{error}</FormError>}
      <Button
        type="button"
        variant="primary"
        size="default"
        disabled={!comprobante || loading}
        className="w-full"
        onClick={onUpload}
      >
        {loading ? "Enviando…" : "Enviar comprobante"}
      </Button>
    </div>
  );
}
