"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

interface Props {
  claseId: string;
  classTitle: string;
  classDate: string; // YYYY-MM-DD
  isCancelled: boolean;
  isPast: boolean;
  activeReservationsCount: number;
}

export function ClasesActions({
  claseId,
  classTitle,
  classDate,
  isCancelled,
  isPast,
  activeReservationsCount,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  // No hay acciones si ya está cancelada o si es pasada
  if (isCancelled || isPast) {
    return null;
  }

  const onCancel = async () => {
    if (loading) return;

    const reservasMsg =
      activeReservationsCount > 0
        ? `\n\n⚠ Hay ${activeReservationsCount} reserva${activeReservationsCount === 1 ? "" : "s"} activa${activeReservationsCount === 1 ? "" : "s"}. Se cancelarán automáticamente y se enviará un email de aviso a cada cliente.`
        : "";

    const confirmed = window.confirm(
      `¿Cancelar la clase "${classTitle}" del ${classDate}?${reservasMsg}`,
    );
    if (!confirmed) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/classes/${claseId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const code = json?.error;
        if (code === "unauthorized") {
          setError("Sesión expirada. Volvé a entrar.");
        } else if (code === "already_cancelled_or_not_found") {
          setError("La clase ya estaba cancelada.");
        } else {
          setError("No se pudo cancelar la clase.");
        }
        setLoading(false);
        return;
      }

      const { cancelledReservations = 0, emailsSent = 0, emailsFailed = 0 } =
        json ?? {};

      if (emailsFailed > 0) {
        setSuccessMsg(
          `Clase cancelada. ${cancelledReservations} reserva${cancelledReservations === 1 ? "" : "s"} cancelada${cancelledReservations === 1 ? "" : "s"}. ⚠ ${emailsFailed} email${emailsFailed === 1 ? "" : "s"} no pudo enviarse — revisá los logs.`,
        );
      } else if (cancelledReservations > 0) {
        setSuccessMsg(
          `Clase cancelada. Se notificó a ${emailsSent} cliente${emailsSent === 1 ? "" : "s"} por email.`,
        );
      }

      router.refresh();
      setLoading(false);
    } catch (e) {
      console.error(e);
      setError("Error de conexión.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="rounded border border-carbon/30 bg-white px-3 py-1.5 text-[0.75rem] font-medium uppercase tracking-wide text-carbon/70 transition hover:bg-red-50 hover:text-red-700 hover:border-red-300 disabled:opacity-50"
      >
        {loading ? "Cancelando…" : "Cancelar clase"}
      </button>
      {error && <p className="text-[0.72rem] text-red-700">{error}</p>}
      {successMsg && (
        <p className="text-[0.72rem] text-green-700">{successMsg}</p>
      )}
    </div>
  );
}