import Link from "next/link";
import {
  getReservasForAdmin,
  type ReservaAdmin,
  type ReservasFilter,
} from "@/lib/admin/reservas-queries";
import { ReservaActions } from "./ReservaActions";
import { FiltroMesForm } from "./FiltroMesForm";


export const dynamic = "force-dynamic";

export const metadata = {
  title: "Reservas · Admin Menesteres",
};

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

// Genera lista de últimos 12 meses para el selector
function getUltimos12Meses(): { value: string; label: string }[] {
  const meses = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("es-AR", {
      month: "long",
      year: "numeric",
    });
    meses.push({ value, label });
  }
  return meses;
}

interface PageProps {
  searchParams: Promise<{ estado?: string; mes?: string }>;
}

export default async function ReservasAdminPage({ searchParams }: PageProps) {
  const { estado, mes } = await searchParams;

  const filter: ReservasFilter = {
    status:
      estado === "pending" ||
      estado === "confirmed" ||
      estado === "cancelled"
        ? estado
        : "all",
    mes: mes ?? undefined,
  };

  const reservas = await getReservasForAdmin(200, filter);

  const counts = {
    total: reservas.length,
    pending: reservas.filter((r) => r.status === "pending").length,
    confirmed: reservas.filter((r) => r.status === "confirmed").length,
    cancelled: reservas.filter((r) => r.status === "cancelled").length,
  };

  const meses = getUltimos12Meses();

  // Construir URL de export con los filtros actuales
  const exportParams = new URLSearchParams();
  if (estado) exportParams.set("estado", estado);
  if (mes) exportParams.set("mes", mes);
  const exportUrl = `/api/admin/reservations/export?${exportParams.toString()}`;

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

      {/* Filtros */}
      <div className="mt-8 flex flex-wrap items-end gap-4">
        {/* Filtro por estado */}
        <div>
          <p className="font-mono text-[0.65rem] uppercase tracking-eyebrow text-carbon/55 mb-1.5">
            Estado
          </p>
          <div className="flex gap-1">
            {[
              { value: "", label: "Todos" },
              { value: "pending", label: "Pendientes" },
              { value: "confirmed", label: "Pagadas" },
              { value: "cancelled", label: "Canceladas" },
            ].map((opt) => {
              const isActive = (estado ?? "") === opt.value;
              const params = new URLSearchParams();
              if (opt.value) params.set("estado", opt.value);
              if (mes) params.set("mes", mes);
              const href = `/admin/reservas?${params.toString()}`;

              return (
                <Link
                  key={opt.value}
                  href={href}
                  className={[
                    "px-3 py-1.5 font-sans text-[0.78rem] border transition",
                    isActive
                      ? "bg-carbon text-crema border-carbon"
                      : "bg-white text-carbon/70 border-carbon/20 hover:border-carbon/40",
                  ].join(" ")}
                >
                  {opt.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Botón export CSV */}
        <div className="ml-auto">
          
            <a href={exportUrl}
            download
            className="flex items-center gap-2 border border-carbon/20 bg-white px-4 py-2 font-sans text-[0.82rem] text-carbon/70 transition hover:border-carbon/40 hover:text-carbon"
          >
            ↓ Exportar CSV
          </a>
        </div>
      </div>

      {/* Formulario oculto para el select de mes (necesita JS mínimo) */}
      <FiltroMesForm mesActual={mes ?? ""} estadoActual={estado ?? ""} />

      {reservas.length === 0 ? (
        <div className="mt-10 border border-dashed border-carbon/20 bg-white p-12 text-center">
          <p className="font-body text-[0.95rem] text-carbon/60">
            No hay reservas para los filtros seleccionados.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden border border-carbon/10 bg-white">
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
                          &quot;{r.notes}&quot;
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

      <p className="mt-6 font-body text-[0.78rem] text-carbon/40">
        Mostrando {reservas.length} reservas
        {filter.status && filter.status !== "all"
          ? ` · ${statusLabel(filter.status as ReservaAdmin["status"])}`
          : ""}
        {mes ? ` · ${meses.find((m) => m.value === mes)?.label ?? mes}` : ""}.
        {" "}
        
        <a
            href={exportUrl}
            download
            className="flex items-center gap-2 border border-carbon/20 bg-white px-4 py-2 font-sans text-[0.82rem] text-carbon/70 transition hover:border-carbon/40 hover:text-carbon"
          >
            ↓ Exportar CSV
          </a>
      </p>
    </div>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

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

