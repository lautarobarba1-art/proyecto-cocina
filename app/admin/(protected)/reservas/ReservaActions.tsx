"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

type Status = "pending" | "confirmed" | "cancelled";

interface Props {
  reservaId: string;
  status: Status;
  customerName: string;
}

export function ReservaActions({ reservaId, status, customerName }: Props) {
  const router = useRouter();
  const [loading, setLoading] = React.useState<null | "confirm" | "cancel">(
    null,
  );
  const [error, setError] = React.useState<string | null>(null);

  const callAction = async (action: "confirm" | "cancel") => {
    setError(null);
    setLoading(action);

    try {
      const res = await fetch(`/api/admin/reservations/${reservaId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const code = json?.error;
        if (code === "unauthorized") {
          setError("Sesión expirada. Volvé a entrar.");
        } else if (code === "not_pending_or_not_found") {
          setError("La reserva ya no está pendiente.");
        } else if (code === "already_cancelled_or_not_found") {
          setError("La reserva ya está cancelada.");
        } else {
          setError("No se pudo aplicar la acción.");
        }
        setLoading(null);
        return;
      }

      // Éxito → refrescar la página para que el estado nuevo se vea
      router.refresh();
      setLoading(null);
    } catch (e) {
      console.error(e);
      setError("Error de conexión.");
      setLoading(null);
    }
  };

  const onConfirm = () => {
    if (loading) return;
    callAction("confirm");
  };

  const onCancel = () => {
    if (loading) return;
    const ok = window.confirm(
      `¿Cancelar la reserva de ${customerName}?\n\nEl cupo se libera automáticamente.`,
    );
    if (!ok) return;
    callAction("cancel");
  };

  // Cancelada → sin acciones
  if (status === "cancelled") {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {status === "pending" && (
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading !== null}
          className="rounded border border-green-700 bg-green-700 px-3 py-1.5 text-[0.75rem] font-medium uppercase tracking-wide text-white transition hover:bg-green-800 disabled:opacity-50"
        >
          {loading === "confirm" ? "Marcando…" : "Marcar pagada"}
        </button>
      )}
      <button
        type="button"
        onClick={onCancel}
        disabled={loading !== null}
        className="rounded border border-carbon/30 bg-white px-3 py-1.5 text-[0.75rem] font-medium uppercase tracking-wide text-carbon/70 transition hover:bg-red-50 hover:text-red-700 hover:border-red-300 disabled:opacity-50"
      >
        {loading === "cancel" ? "Cancelando…" : "Cancelar"}
      </button>
      {error && (
        <p className="text-[0.72rem] text-red-700">{error}</p>
      )}
    </div>
  );
}
