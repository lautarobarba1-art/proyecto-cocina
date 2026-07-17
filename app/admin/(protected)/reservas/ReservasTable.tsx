import type { ReservaAdmin } from "@/lib/admin/reservas-queries";
import { ReservaActions } from "./ReservaActions";

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

function statusClass(status: ReservaAdmin["status"]): string {
  if (status === "pending")
    return "bg-yellow-100 text-yellow-900 border-yellow-300";
  if (status === "confirmed")
    return "bg-green-100 text-green-900 border-green-300";
  return "bg-gray-100 text-gray-700 border-gray-300";
}

interface Props {
  reservas: ReservaAdmin[];
  /** Ocultar la columna de clase cuando ya se está viendo una sola clase. */
  showClaseColumn?: boolean;
}

export function ReservasTable({ reservas, showClaseColumn = true }: Props) {
  if (reservas.length === 0) {
    return (
      <div className="mt-10 border border-dashed border-carbon/20 bg-white p-12 text-center">
        <p className="font-body text-[0.95rem] text-carbon/60">
          No hay reservas para los filtros seleccionados.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 overflow-hidden border border-carbon/10 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left font-sans text-[0.85rem]">
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
                      <div className="text-red-700 text-[0.75rem] mt-1">
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
                  <span
                    className={[
                      "inline-block rounded border px-2 py-1 text-[0.72rem] font-medium uppercase tracking-wide",
                      statusClass(r.status),
                    ].join(" ")}
                  >
                    {statusLabel(r.status)}
                  </span>
                </Td>
                <Td>
                  {r.comprobanteUrl ? (
                    <a
                      href={`/api/admin/reservations/${r.id}/comprobante`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded border border-green-600 bg-green-50 px-2 py-1 text-[0.72rem] font-medium text-green-800 transition hover:bg-green-100"
                    >
                      ✓ Ver comprobante
                    </a>
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
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow">
      {children}
    </th>
  );
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={["px-4 py-3", className ?? ""].join(" ")}>{children}</td>
  );
}
