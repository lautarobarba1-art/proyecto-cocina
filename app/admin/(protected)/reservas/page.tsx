import {
  getReservasForAdmin,
  countComprobantesPendientes,
  type ReservaAdmin,
  type ReservasFilter,
} from "@/lib/admin/reservas-queries";
import { ReservasTable, statusLabel } from "./ReservasTable";
import { FiltroMesForm } from "./FiltroMesForm";
import { PageHeader } from "../_shared/PageHeader";
import { SummaryPill } from "../_shared/SummaryPill";
import { SegmentedFilter } from "../_shared/SegmentedFilter";


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
  searchParams: Promise<{ estado?: string; mes?: string; comprobante?: string }>;
}

export default async function ReservasAdminPage({ searchParams }: PageProps) {
  const { estado, mes, comprobante } = await searchParams;
  const comprobantePendiente = comprobante === "pendiente";

  const filter: ReservasFilter = {
    status:
      estado === "pending" ||
      estado === "confirmed" ||
      estado === "cancelled"
        ? estado
        : "all",
    mes: mes ?? undefined,
    comprobantePendiente,
  };

  const [reservas, comprobantesPendientesCount] = await Promise.all([
    getReservasForAdmin(200, filter),
    countComprobantesPendientes(),
  ]);

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
      <PageHeader
        eyebrow="Panel · Reservas"
        title="Reservas recibidas"
        actions={
          <>
            <SummaryPill label="Total" value={counts.total} />
            <SummaryPill label="Pendientes" value={counts.pending} />
            <SummaryPill label="Pagadas" value={counts.confirmed} />
            <SummaryPill label="Canceladas" value={counts.cancelled} />
            <SummaryPill
              label="Sin revisar"
              value={comprobantesPendientesCount}
              tone={comprobantesPendientesCount > 0 ? "brand" : "neutral"}
            />
          </>
        }
      />

      {/* Filtros */}
      <div className="mt-8 flex flex-wrap items-end gap-4">
        <SegmentedFilter
          label="Estado"
          options={[
            { value: "", label: "Todos" },
            { value: "pending", label: "Pendientes" },
            { value: "confirmed", label: "Pagadas" },
            { value: "cancelled", label: "Canceladas" },
          ].map((opt) => {
            const params = new URLSearchParams();
            if (opt.value) params.set("estado", opt.value);
            if (mes) params.set("mes", mes);
            return {
              href: `/admin/reservas?${params.toString()}`,
              label: opt.label,
              active: (estado ?? "") === opt.value,
            };
          })}
        />

        <SegmentedFilter
          label="Comprobante"
          options={[
            { value: "", label: "Todos" },
            { value: "pendiente", label: "Sin revisar" },
          ].map((opt) => {
            const params = new URLSearchParams();
            if (estado) params.set("estado", estado);
            if (mes) params.set("mes", mes);
            if (opt.value) params.set("comprobante", opt.value);
            return {
              href: `/admin/reservas?${params.toString()}`,
              label: opt.label,
              active: (comprobante ?? "") === opt.value,
            };
          })}
        />

        {/* Botón export CSV */}
        <div className="ml-auto">
          <a
            href={exportUrl}
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
        <p className="mt-1 font-body text-[0.75rem] text-terracota-deep">
          ⚠ Se muestran solo las últimas 200 reservas. Usá los filtros de estado o mes para ver resultados más específicos.
        </p>
      )}
    </div>
  );
}

