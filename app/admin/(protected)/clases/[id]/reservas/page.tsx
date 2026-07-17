import Link from "next/link";
import { notFound } from "next/navigation";
import { getClaseAdminById } from "@/lib/admin/clases-queries";
import { getReservasForAdmin } from "@/lib/admin/reservas-queries";
import { ReservasTable, formatDateLong } from "../../../reservas/ReservasTable";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Reservas de la clase · Admin Menesteres",
};

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ incluirCanceladas?: string }>;
}

export default async function ReservasDeClasePage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { incluirCanceladas } = await searchParams;
  const mostrarCanceladas = incluirCanceladas === "1";

  const clase = await getClaseAdminById(id);
  if (!clase) {
    notFound();
  }

  // Trae todas las reservas de la clase (todo estado); el toggle solo
  // decide qué se muestra en la tabla, no afecta los contadores de ocupación.
  const todasLasReservas = await getReservasForAdmin(1000, { classId: id });
  const reservasActivas = todasLasReservas.filter((r) => r.status !== "cancelled");
  const reservasAMostrar = mostrarCanceladas ? todasLasReservas : reservasActivas;
  const totalAsistentes = reservasActivas.reduce((sum, r) => sum + r.spots, 0);

  const exportUrl = `/api/admin/reservations/export?classId=${id}`;

  return (
    <div>
      <div className="mb-4">
        <Link
          href="/admin/clases"
          className="font-sans text-[0.85rem] text-carbon/60 hover:text-carbon"
        >
          ← Volver al listado de clases
        </Link>
      </div>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow text-terracota">
            Panel · Clases · Reservas
          </p>
          <h1 className="mt-3 font-display text-3xl font-normal tracking-tightish text-carbon">
            {clase.title}
          </h1>
          <p className="mt-2 font-body text-[0.85rem] text-carbon/60">
            {formatDateLong(clase.date)} · {clase.startTime} – {clase.endTime}
            {clase.isCancelled && (
              <span className="ml-2 text-red-700">(clase cancelada)</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <SummaryPill label="Cupos totales" value={clase.totalSpots} />
          <SummaryPill
            label="Ocupados"
            value={clase.totalSpots - clase.spotsLeft}
          />
          <SummaryPill label="Disponibles" value={clase.spotsLeft} />
          <SummaryPill label="Reservas" value={reservasActivas.length} />
          <SummaryPill label="Asistentes" value={totalAsistentes} />
        </div>
      </header>

      <div className="mt-8 flex flex-wrap items-end gap-4">
        <Link
          href={
            mostrarCanceladas
              ? `/admin/clases/${id}/reservas`
              : `/admin/clases/${id}/reservas?incluirCanceladas=1`
          }
          className={[
            "px-3 py-1.5 font-sans text-[0.78rem] border transition",
            mostrarCanceladas
              ? "bg-carbon text-crema border-carbon"
              : "bg-white text-carbon/70 border-carbon/20 hover:border-carbon/40",
          ].join(" ")}
        >
          {mostrarCanceladas
            ? "✓ Incluyendo canceladas"
            : "Incluir canceladas"}
        </Link>

        <div className="ml-auto">
          <a
            href={exportUrl}
            download
            className="flex items-center gap-2 border border-carbon/20 bg-white px-4 py-2 font-sans text-[0.82rem] text-carbon/70 transition hover:border-carbon/40 hover:text-carbon"
          >
            ↓ Exportar CSV de esta clase
          </a>
        </div>
      </div>

      <ReservasTable reservas={reservasAMostrar} showClaseColumn={false} />

      <p className="mt-6 font-body text-[0.78rem] text-carbon/40">
        Mostrando {reservasAMostrar.length} reserva
        {reservasAMostrar.length === 1 ? "" : "s"}
        {mostrarCanceladas ? "" : " (pendientes y pagadas)"}.
      </p>
    </div>
  );
}

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
