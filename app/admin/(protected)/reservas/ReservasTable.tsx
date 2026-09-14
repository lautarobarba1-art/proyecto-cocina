import type { ReservaAdmin } from "@/lib/admin/reservas-queries";
import { ReservaActions } from "./ReservaActions";
import { TableWrapper, Th, Td, TableEmptyState } from "../_shared/Table";
import { StatusBadge, type StatusTone } from "../_shared/StatusBadge";

export function formatDateLong(isoDate: string): string {
  if (!isoDate) return "—";
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

export function statusLabel(status: ReservaAdmin["status"]): string {
  if (status === "pending") return "Pendiente";
  if (status === "confirmed") return "Pagada";
  return "Cancelada";
}

function statusTone(status: ReservaAdmin["status"]): StatusTone {
  if (status === "pending") return "warning";
  if (status === "confirmed") return "success";
  return "neutral";
}

interface Props {
  reservas: ReservaAdmin[];
  /** Ocultar la columna de clase cuando ya se está viendo una sola clase. */
  showClaseColumn?: boolean;
}

export function ReservasTable({ reservas, showClaseColumn = true }: Props) {
  if (reservas.length === 0) {
    return (
      <TableEmptyState>No hay reservas para los filtros seleccionados.</TableEmptyState>
    );
  }

  return (
    <TableWrapper minWidth="760px" className="mt-6">
      <thead className="border-b border-carbon/10 bg-crema-light/40">
        <tr className="text-carbon/60">
          <Th>Reservada</Th>
          <Th>Cliente</Th>
          {showClaseColumn && <Th>Clase</Th>}
          <Th>Fecha clase</Th>
          <Th>Cupos</Th>
          <Th>Estado</Th>
          <Th>Comprobante</Th>
          <Th>Acciones</Th>
        </tr>
      </thead>
      <tbody>
            {reservas.map((r) => (
              <tr
                key={r.id}
                className="border-b border-carbon/5 last:border-b-0 align-top"
              >
                <Td className="text-carbon/60 whitespace-nowrap text-[0.8rem]">
                  {formatDateTime(r.createdAt)}
                </Td>
                <Td>
                  <div className="font-medium text-carbon">
                    {r.customerName}
                  </div>
                  <div className="text-carbon/60 text-[0.8rem]">
                    {r.customerEmail}
                  </div>
                  {r.customerPhone && (
                    <div className="text-carbon/50 text-[0.78rem]">
                      {r.customerPhone}
                    </div>
                  )}
                  {r.notes && (
                    <div className="mt-2 max-w-[28ch] text-carbon/55 text-[0.78rem] italic">
                      &ldquo;{r.notes}&rdquo;
                    </div>
                  )}
                </Td>
                {showClaseColumn && (
                  <Td>
                    <div className="text-carbon">{r.classTitle}</div>
                    {r.classIsCancelled && (
                      <div className="text-rojo text-[0.75rem] mt-1">
                        (clase cancelada)
                      </div>
                    )}
                  </Td>
                )}
                <Td className="whitespace-nowrap text-carbon/80">
                  {formatDateLong(r.classDate)}
                  <div className="text-carbon/50 text-[0.78rem]">
                    {r.classStartTime} h
                  </div>
                </Td>
                <Td className="text-carbon/80">{r.spots}</Td>
                <Td>
                  <StatusBadge tone={statusTone(r.status)}>
                    {statusLabel(r.status)}
                  </StatusBadge>
                </Td>
                <Td>
                  {r.comprobanteUrl ? (
                    <div className="flex flex-col items-start gap-1">
                      <a
                        href={`/api/admin/reservations/${r.id}/comprobante`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded border border-exito/40 bg-exito-soft px-2 py-1 text-[0.72rem] font-medium text-exito transition hover:bg-exito-soft/70"
                      >
                        ✓ Ver comprobante
                      </a>
                      {r.status === "pending" && (
                        <StatusBadge tone="brand" size="sm">
                          Sin revisar
                        </StatusBadge>
                      )}
                    </div>
                  ) : r.status === "pending" ? (
                    <span className="text-[0.78rem] text-carbon/40">
                      Sin comprobante
                    </span>
                  ) : null}
                </Td>
                <Td>
                  <ReservaActions
                    reservaId={r.id}
                    status={r.status}
                    customerName={r.customerName}
                  />
                </Td>
              </tr>
            ))}
          </tbody>
    </TableWrapper>
  );
}
