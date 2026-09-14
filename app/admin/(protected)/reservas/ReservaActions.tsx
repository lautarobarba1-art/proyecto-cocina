"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useConfirm } from "../_shared/useConfirm";

type Status = "pending" | "confirmed" | "cancelled";

interface Props {
  reservaId: string;
  status: Status;
  customerName: string;
}

export function ReservaActions({ reservaId, status, customerName }: Props) {
  const router = useRouter();
  const { confirm, dialog } = useConfirm();
  const [loading, setLoading] = React.useState<
    null | "confirm" | "cancel" | "delete"
  >(null);
  const [error, setError] = React.useState<string | null>(null);

  const callAction = async (action: "confirm" | "cancel" | "delete") => {
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
        } else if (code === "not_found") {
          setError("La reserva ya no existe.");
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

  const onConfirm = async () => {
    if (loading) return;
    const ok = await confirm({
      title: `¿Confirmar el pago de ${customerName}?`,
      description: "Se enviará un email de confirmación al cliente.",
      confirmLabel: "Confirmar pago",
    });
    if (!ok) return;
    callAction("confirm");
  };

  const onCancel = async () => {
    if (loading) return;
    const ok = await confirm({
      title: `¿Cancelar la reserva de ${customerName}?`,
      description: "El cupo se libera automáticamente y se le enviará un email al cliente.",
      confirmLabel: "Cancelar reserva",
      tone: "danger",
    });
    if (!ok) return;
    callAction("cancel");
  };

  const onDelete = async () => {
    if (loading) return;
    const ok = await confirm({
      title: `¿Eliminar definitivamente la reserva de ${customerName}?`,
      description:
        "Esta acción no se puede deshacer y NO se envía ningún email al cliente. Usala solo para reservas mal hechas (duplicados, pruebas, errores), no para cancelaciones legítimas.",
      confirmLabel: "Eliminar",
      tone: "danger",
    });
    if (!ok) return;
    callAction("delete");
  };

  return (
    <div className="flex flex-col gap-2">
      {status === "pending" && (
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading !== null}
          className="rounded border border-exito bg-exito px-3 py-1.5 text-[0.75rem] font-medium uppercase tracking-wide text-white transition hover:bg-exito/90 disabled:opacity-50"
        >
          {loading === "confirm" ? "Marcando…" : "Marcar pagada"}
        </button>
      )}
      {status !== "cancelled" && (
        <button
          type="button"
          onClick={onCancel}
          disabled={loading !== null}
          className="rounded border border-carbon/30 bg-white px-3 py-1.5 text-[0.75rem] font-medium uppercase tracking-wide text-carbon/70 transition hover:border-rojo/30 hover:bg-rojo/5 hover:text-rojo disabled:opacity-50"
        >
          {loading === "cancel" ? "Cancelando…" : "Cancelar"}
        </button>
      )}
      <button
        type="button"
        onClick={onDelete}
        disabled={loading !== null}
        className="rounded border border-rojo/30 bg-white px-3 py-1.5 text-[0.75rem] font-medium uppercase tracking-wide text-rojo/70 transition hover:bg-rojo hover:text-white disabled:opacity-50"
      >
        {loading === "delete" ? "Eliminando…" : "Eliminar"}
      </button>
      {error && <p className="text-[0.72rem] text-rojo">{error}</p>}
      {dialog}
    </div>
  );
}
