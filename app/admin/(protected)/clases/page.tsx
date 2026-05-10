import Link from "next/link";
import {
  getClasesForAdmin,
  type ClaseAdmin,
} from "@/lib/admin/clases-queries";
import { ClasesActions } from "./ClasesActions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Clases · Admin Menesteres",
};

interface PageProps {
  searchParams: Promise<{ filtro?: string }>;
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

function isClasePast(isoDate: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return isoDate < today;
}

interface StatusInfo {
  label: string;
  className: string;
}

function getStatusInfo(c: ClaseAdmin): StatusInfo {
  if (c.isCancelled) {
    return {
      label: "Cancelada",
      className: "bg-gray-100 text-gray-700 border-gray-300",
    };
  }
  if (isClasePast(c.date)) {
    return {
      label: "Pasada",
      className: "bg-blue-50 text-blue-800 border-blue-200",
    };
  }
  if (c.spotsLeft <= 0) {
    return {
      label: "Llena",
      className: "bg-red-50 text-red-800 border-red-200",
    };
  }
  if (c.spotsLeft <= Math.max(1, Math.ceil(c.totalSpots * 0.3))) {
    return {
      label: "Pocos cupos",
      className: "bg-yellow-100 text-yellow-900 border-yellow-300",
    };
  }
  return {
    label: "Disponible",
    className: "bg-green-100 text-green-900 border-green-300",
  };
}

// ---------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------

export default async function ClasesAdminPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filtro = params.filtro ?? "proximas"; // proximas | todas
  const onlyUpcoming = filtro !== "todas";

  const clases = await getClasesForAdmin({ onlyUpcoming });

  // Counts para los pills de resumen (sin filtro)
  const allClases = await getClasesForAdmin({ onlyUpcoming: false });
  const counts = {
    proximas: allClases.filter(
      (c) => !c.isCancelled && !isClasePast(c.date),
    ).length,
    canceladas: allClases.filter((c) => c.isCancelled).length,
    pasadas: allClases.filter(
      (c) => !c.isCancelled && isClasePast(c.date),
    ).length,
  };

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow text-terracota">
            Panel · Clases
          </p>
          <h1 className="mt-3 font-display text-3xl font-normal tracking-tightish text-carbon">
            Clases programadas
          </h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <SummaryPill label="Próximas" value={counts.proximas} />
          <SummaryPill label="Pasadas" value={counts.pasadas} />
          <SummaryPill label="Canceladas" value={counts.canceladas} />
        </div>
      </header>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <nav className="flex gap-1 border border-carbon/10 bg-white">
          <FilterLink
            href="/admin/clases?filtro=proximas"
            active={filtro === "proximas"}
          >
            Solo próximas
          </FilterLink>
          <FilterLink
            href="/admin/clases?filtro=todas"
            active={filtro === "todas"}
          >
            Todas
          </FilterLink>
        </nav>
        <Link
          href="/admin/clases/nueva"
          className="rounded bg-terracota px-4 py-2 font-sans text-[0.85rem] font-medium uppercase tracking-wide text-crema transition hover:bg-terracota-deep"
        >
          + Nueva clase
        </Link>
      </div>

      {clases.length === 0 ? (
        <div className="mt-10 border border-dashed border-carbon/20 bg-white p-12 text-center">
          <p className="font-body text-[0.95rem] text-carbon/60">
            {onlyUpcoming
              ? "No hay clases próximas programadas."
              : "Todavía no hay clases registradas."}
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden border border-carbon/10 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-[0.85rem]">
              <thead className="border-b border-carbon/10 bg-crema-light/40">
                <tr className="text-carbon/60">
                  <Th>Fecha</Th>
                  <Th>Clase</Th>
                  <Th>Horario</Th>
                  <Th>Cupos</Th>
                  <Th>Reservas</Th>
                  <Th>Precio</Th>
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
                      <Td className="whitespace-nowrap text-carbon/70">
                        {c.startTime} – {c.endTime}
                      </Td>
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
                          activeReservationsCount={c.activeReservationsCount}
                        />
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="mt-8 font-body text-[0.78rem] text-carbon/40">
        Mostrando {clases.length} {clases.length === 1 ? "clase" : "clases"}.
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

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={[
        "px-4 py-2 font-sans text-[0.8rem] transition",
        active
          ? "bg-carbon text-crema"
          : "text-carbon/70 hover:bg-crema-light/60",
      ].join(" ")}
    >
      {children}
    </Link>
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