"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useConfirm } from "../_shared/useConfirm";

interface Props {
  claseId: string;
  classTitle: string;
  classDate: string; // YYYY-MM-DD
  isCancelled: boolean;
  isPast: boolean;
  isEvento: boolean;
  activeReservationsCount: number;
}

export function ClasesActions({
  claseId,
  classTitle,
  classDate,
  isCancelled,
  isPast,
  isEvento,
  activeReservationsCount,
}: Props) {
  const router = useRouter();
  const { confirm, dialog } = useConfirm();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  // Cancelar solo tiene sentido si la clase todavía está activa y no pasó,
  // pero "Ver reservas" sigue siendo útil incluso para clases pasadas o canceladas.
  const canCancel = !isCancelled && !isPast;

  const onCancel = async () => {
    if (loading) return;

    const reservasMsg =
      activeReservationsCount > 0
        ? `⚠ Hay ${activeReservationsCount} reserva${activeReservationsCount === 1 ? "" : "s"} activa${activeReservationsCount === 1 ? "" : "s"}. Se cancelarán automáticamente y se enviará un email de aviso a cada cliente.`
        : "";

    const confirmed = await confirm({
      title: `¿Cancelar la clase "${classTitle}" del ${classDate}?`,
      description: reservasMsg || undefined,
      confirmLabel: "Cancelar clase",
      tone: "danger",
    });
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
      <Link
        href={`/admin/clases/${claseId}/reservas`}
        className="rounded border border-carbon/15 bg-white px-3 py-1.5 text-center text-[0.75rem] font-medium uppercase tracking-wide text-carbon/70 transition hover:border-carbon/30 hover:text-carbon"
      >
        Ver reservas
      </Link>
      {!isEvento && (
        <Link
          href={`/admin/clases/nueva?desde=${claseId}`}
          className="rounded border border-carbon/15 bg-white px-3 py-1.5 text-center text-[0.75rem] font-medium uppercase tracking-wide text-carbon/70 transition hover:border-carbon/30 hover:text-carbon"
        >
          Duplicar
        </Link>
      )}
      {canCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded border border-carbon/30 bg-white px-3 py-1.5 text-[0.75rem] font-medium uppercase tracking-wide text-carbon/70 transition hover:border-rojo/30 hover:bg-rojo/5 hover:text-rojo disabled:opacity-50"
        >
          {loading ? "Cancelando…" : "Cancelar clase"}
        </button>
      )}
      {error && <p className="text-[0.72rem] text-rojo">{error}</p>}
      {successMsg && (
        <p className="text-[0.72rem] text-exito">{successMsg}</p>
      )}
      {dialog}
    </div>
  );
}