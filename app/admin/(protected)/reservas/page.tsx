import { getReservasForAdmin, type ReservaAdmin } from "@/lib/admin/reservas-queries";
import { ReservaActions } from "./ReservaActions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Reservas · Admin Menesteres",
};

// ---------------------------------------------------------------------
// Helpers de formato
// ---------------------------------------------------------------------

function formatDateLong(isoDate: string): string {
  if (!isoDate) return "—";
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status: ReservaAdmin["status"]): string {
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

// ---------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------

export default async function ReservasAdminPage() {
  const reservas = await getReservasForAdmin(50);

  // Resumen rápido
  const counts = {
    total: reservas.length,
    pending: reservas.filter((r) => r.status === "pending").length,
    confirmed: reservas.filter((r) => r.status === "confirmed").length,
    cancelled: reservas.filter((r) => r.status === "cancelled").length,
  };

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow text-terracota">
            Panel · Reservas
          </p>
          <h1 className="mt-3 font-display text-3xl font-normal tracking-tightish text-carbon">
            Reservas recibidas
          </h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <SummaryPill label="Total" value={counts.total} />
          <SummaryPill label="Pendientes" value={counts.pending} />
          <SummaryPill label="Pagadas" value={counts.confirmed} />
          <SummaryPill label="Canceladas" value={counts.cancelled} />
        </div>
      </header>

      {reservas.length === 0 ? (
        <div className="mt-10 border border-dashed border-carbon/20 bg-white p-12 text-center">
          <p className="font-body text-[0.95rem] text-carbon/60">
            Todavía no hay reservas registradas.
          </p>
        </div>
      ) : (
        <div className="mt-10 overflow-hidden border border-carbon/10 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-[0.85rem]">
              <thead className="border-b border-carbon/10 bg-crema-light/40">
                <tr className="text-carbon/60">
                  <Th>Reservada</Th>
                  <Th>Cliente</Th>
                  <Th>Clase</Th>
                  <Th>Fecha clase</Th>
                  <Th>Cupos</Th>
                  <Th>Estado</Th>
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
                          “{r.notes}”
                        </div>
                      )}
                    </Td>
                    <Td>
                      <div className="text-carbon">{r.classTitle}</div>
                      {r.classIsCancelled && (
                        <div className="text-red-700 text-[0.75rem] mt-1">
                          (clase cancelada)
                        </div>
                      )}
                    </Td>
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
      )}

      <p className="mt-8 font-body text-[0.78rem] text-carbon/40">
        Mostrando las últimas {reservas.length} reservas.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------
// Sub-componentes locales
// ---------------------------------------------------------------------

function SummaryPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-carbon/10 bg-white px-4 py-2">
      <div className="font-mono text-[0.65rem] uppercase tracking-eyebrow text-carbon/55">
        {label}
      </div>
      <div className="font-display text-lg text-carbon">{value}</div>
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