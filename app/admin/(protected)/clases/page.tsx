import Link from "next/link";
import {
  getClasesForAdmin,
  type ClaseAdmin,
} from "@/lib/admin/clases-queries";
import { isClasePast, getStatusInfo } from "@/lib/admin/clases-status";
import { ClasesActions } from "./ClasesActions";
import { PageHeader } from "../_shared/PageHeader";
import { SummaryPill } from "../_shared/SummaryPill";
import { SegmentedFilter } from "../_shared/SegmentedFilter";
import { StatusBadge, type StatusTone } from "../_shared/StatusBadge";
import { TableWrapper, Th, Td, TableEmptyState } from "../_shared/Table";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Clases · Admin Menesteres",
};

interface PageProps {
  searchParams: Promise<{ filtro?: string; categoria?: string }>;
}

// ---------------------------------------------------------------------
// Helpers
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

function formatPrice(price: number): string {
  if (price === 0) return "—";
  const formatted = new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 0,
  }).format(Math.round(price));
  return `$ ${formatted}`;
}

function categoryLabel(cat: ClaseAdmin["categoryEvent"]): string {
  if (cat === "eventos") return "Evento privado";
  if (cat === "ninos") return "Niños";
  return "Adultos";
}

function categoryTone(cat: ClaseAdmin["categoryEvent"]): StatusTone {
  if (cat === "eventos") return "brand";
  if (cat === "ninos") return "olive";
  return "neutral";
}

export default async function ClasesAdminPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filtro = params.filtro ?? "proximas"; // proximas | todas
  const categoria = params.categoria ?? "todas"; // todas | adultos | ninos | eventos
  const onlyUpcoming = filtro !== "todas";

  const categoryEvent =
    categoria === "adultos" || categoria === "ninos" || categoria === "eventos"
      ? categoria
      : undefined;

  const clases = await getClasesForAdmin({ onlyUpcoming, categoryEvent });

  // Counts para los pills de resumen (sin filtro de fecha)
  const allClases = await getClasesForAdmin({ onlyUpcoming: false, categoryEvent });
  const counts = {
    proximas: allClases.filter(
      (c) => !c.isCancelled && !isClasePast(c.date),
    ).length,
    canceladas: allClases.filter((c) => c.isCancelled).length,
    pasadas: allClases.filter(
      (c) => !c.isCancelled && isClasePast(c.date),
    ).length,
  };

  const showBookingColumns = categoria !== "eventos";

  return (
    <div>
      <PageHeader
        eyebrow="Panel · Clases"
        title="Calendario"
        description="Clases abiertas y eventos privados confirmados en el sitio."
        actions={
          <>
            <SummaryPill label="Próximas" value={counts.proximas} />
            <SummaryPill label="Pasadas" value={counts.pasadas} />
            <SummaryPill label="Canceladas" value={counts.canceladas} />
          </>
        }
      />

      <div className="mt-8 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SegmentedFilter
            options={[
              {
                href: `/admin/clases?filtro=proximas${categoria !== "todas" ? `&categoria=${categoria}` : ""}`,
                label: "Solo próximas",
                active: filtro === "proximas",
              },
              {
                href: `/admin/clases?filtro=todas${categoria !== "todas" ? `&categoria=${categoria}` : ""}`,
                label: "Todas",
                active: filtro === "todas",
              },
            ]}
          />
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/clases/nueva"
              className="rounded border border-carbon/15 bg-white px-4 py-2 font-sans text-[0.85rem] font-medium uppercase tracking-wide text-carbon transition hover:border-carbon/30"
            >
              + Nueva clase
            </Link>
            <Link
              href="/admin/clases/nueva?tipo=evento"
              className="rounded bg-terracota px-4 py-2 font-sans text-[0.85rem] font-medium uppercase tracking-wide text-crema transition hover:bg-terracota-deep"
            >
              + Evento privado
            </Link>
          </div>
        </div>
        <SegmentedFilter
          options={[
            {
              href: `/admin/clases?filtro=${filtro}`,
              label: "Todas las categorías",
              active: categoria === "todas",
            },
            {
              href: `/admin/clases?filtro=${filtro}&categoria=adultos`,
              label: "Adultos",
              active: categoria === "adultos",
            },
            {
              href: `/admin/clases?filtro=${filtro}&categoria=ninos`,
              label: "Niños",
              active: categoria === "ninos",
            },
            {
              href: `/admin/clases?filtro=${filtro}&categoria=eventos`,
              label: "Eventos privados",
              active: categoria === "eventos",
            },
          ]}
        />
      </div>

      {clases.length === 0 ? (
        <TableEmptyState>
          {onlyUpcoming
            ? categoria === "eventos"
              ? "No hay eventos privados próximos."
              : "No hay clases próximas programadas."
            : categoria === "eventos"
              ? "Todavía no hay eventos privados registrados."
              : "Todavía no hay clases registradas."}
        </TableEmptyState>
      ) : (
        <TableWrapper minWidth="800px" className="mt-6">
          <thead className="border-b border-carbon/10 bg-crema-light/40">
            <tr className="text-carbon/60">
              <Th>Fecha</Th>
              <Th>Actividad</Th>
              <Th>Tipo</Th>
              <Th>Horario</Th>
              {showBookingColumns ? (
                <>
                  <Th>Cupos</Th>
                  <Th>Reservas</Th>
                  <Th>Precio</Th>
                </>
              ) : null}
              <Th>Estado</Th>
              <Th>Acciones</Th>
            </tr>
          </thead>
          <tbody>
                {clases.map((c) => {
                  const status = getStatusInfo(c);
                  return (
                    <tr
                      key={c.id}
                      className="border-b border-carbon/5 last:border-b-0 align-top"
                    >
                      <Td className="whitespace-nowrap text-carbon/80">
                        {formatDateLong(c.date)}
                      </Td>
                      <Td>
                        <Link
                          href={`/admin/clases/${c.id}`}
                          className="font-medium text-carbon hover:text-terracota"
                        >
                          {c.title}
                        </Link>
                        <div className="text-carbon/60 text-[0.78rem]">
                          {c.categoryLabel} · {c.slug}
                        </div>
                      </Td>
                      <Td>
                        <StatusBadge tone={categoryTone(c.categoryEvent)} size="sm">
                          {categoryLabel(c.categoryEvent)}
                        </StatusBadge>
                      </Td>
                      <Td className="whitespace-nowrap text-carbon/70">
                        {c.startTime} – {c.endTime}
                      </Td>
                      {showBookingColumns ? (
                        c.categoryEvent === "eventos" ? (
                          <>
                            <Td className="text-carbon/40">—</Td>
                            <Td className="text-carbon/40">—</Td>
                            <Td className="text-carbon/40">—</Td>
                          </>
                        ) : (
                          <>
                            <Td className="text-carbon/80">
                              <span className="font-mono">
                                {c.spotsLeft}/{c.totalSpots}
                              </span>
                            </Td>
                            <Td className="text-carbon/80">
                              {c.activeReservationsCount}
                            </Td>
                            <Td className="whitespace-nowrap text-carbon/80">
                              {formatPrice(c.price)}
                            </Td>
                          </>
                        )
                      ) : null}
                      <Td>
                        <span
                          className={[
                            "inline-block rounded border px-2 py-1 text-[0.72rem] font-medium uppercase tracking-wide",
                            status.className,
                          ].join(" ")}
                        >
                          {status.label}
                        </span>
                      </Td>
                      <Td>
                        <ClasesActions
                          claseId={c.id}
                          classTitle={c.title}
                          classDate={formatDateLong(c.date)}
                          isCancelled={c.isCancelled}
                          isPast={isClasePast(c.date)}
                          isEvento={c.categoryEvent === "eventos"}
                          activeReservationsCount={c.activeReservationsCount}
                        />
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
        </TableWrapper>
      )}

      <p className="mt-8 font-body text-[0.78rem] text-carbon/40">
        Mostrando {clases.length}{" "}
        {categoria === "eventos"
          ? clases.length === 1
            ? "evento"
            : "eventos"
          : clases.length === 1
            ? "actividad"
            : "actividades"}
        .
      </p>
    </div>
  );
}