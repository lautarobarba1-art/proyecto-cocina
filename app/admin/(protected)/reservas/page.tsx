import Link from "next/link";
import {
  getReservasForAdmin,
  type ReservaAdmin,
  type ReservasFilter,
} from "@/lib/admin/reservas-queries";
import { ReservasTable, statusLabel } from "./ReservasTable";
import { FiltroMesForm } from "./FiltroMesForm";


export const dynamic = "force-dynamic";

export const metadata = {
  title: "Reservas · Admin Menesteres",
};

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
          <div className="flex flex-wrap gap-1">
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

      <ReservasTable reservas={reservas} />

      <p className="mt-6 font-body text-[0.78rem] text-carbon/40">
        Mostrando {reservas.length} reservas
        {filter.status && filter.status !== "all"
          ? ` · ${statusLabel(filter.status as ReservaAdmin["status"])}`
          : ""}
        {mes ? ` · ${meses.find((m) => m.value === mes)?.label ?? mes}` : ""}.
      </p>
      {reservas.length >= 200 && (
        <p className="mt-1 font-body text-[0.75rem] text-amber-700">
          ⚠ Se muestran solo las últimas 200 reservas. Usá los filtros de estado o mes para ver resultados más específicos.
        </p>
      )}
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

