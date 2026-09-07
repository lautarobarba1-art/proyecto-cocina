import Link from "next/link";
import { countComprobantesPendientes } from "@/lib/admin/reservas-queries";
import { countNewInquiries } from "@/lib/admin/inquiries-queries";
import { getClasesForAdmin, type ClaseAdmin } from "@/lib/admin/clases-queries";
import { getStatusInfo } from "@/lib/admin/clases-status";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Inicio · Admin Menesteres",
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

function porOcurrenciaAsc(a: ClaseAdmin, b: ClaseAdmin): number {
  return `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`);
}

export default async function AdminHomePage() {
  const [comprobantesPendientes, consultasNuevas, clasesProximas] =
    await Promise.all([
      countComprobantesPendientes(),
      countNewInquiries(),
      getClasesForAdmin({ onlyUpcoming: true }),
    ]);

  const proximasClases = [...clasesProximas]
    .sort(porOcurrenciaAsc)
    .slice(0, 5);

  return (
    <div>
      <h1 className="font-display text-3xl font-normal tracking-tightish text-carbon">
        Hola.
      </h1>
      <p className="mt-3 font-body text-[1rem] leading-relaxed text-carbon/70">
        Esto es lo que necesita tu atención hoy.
      </p>

      {/* Métricas accionables */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <MetricCard
          href="/admin/reservas?estado=pending&comprobante=pendiente"
          label="Comprobantes sin revisar"
          value={comprobantesPendientes}
          hint="Reservas pendientes con comprobante ya subido, esperando confirmación."
        />
        <MetricCard
          href="/admin/inquiries"
          label="Consultas sin leer"
          value={consultasNuevas}
          hint="Contacto, eventos privados y alquiler del espacio."
        />
      </div>

      {/* Próximas clases */}
      <div className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-xl text-carbon">Próximas clases</h2>
          <Link
            href="/admin/clases"
            className="font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow text-terracota hover:underline"
          >
            Ver todas →
          </Link>
        </div>

        {proximasClases.length === 0 ? (
          <div className="mt-4 border border-dashed border-carbon/20 bg-white p-8 text-center">
            <p className="font-body text-[0.9rem] text-carbon/60">
              No hay clases próximas programadas.
            </p>
          </div>
        ) : (
          <div className="mt-4 overflow-hidden border border-carbon/10 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left font-sans text-[0.85rem]">
                <thead className="border-b border-carbon/10 bg-crema-light/40">
                  <tr className="text-carbon/60">
                    <Th>Fecha</Th>
                    <Th>Clase</Th>
                    <Th>Cupos</Th>
                    <Th>Estado</Th>
                  </tr>
                </thead>
                <tbody>
                  {proximasClases.map((c) => {
                    const status = getStatusInfo(c);
                    return (
                      <tr
                        key={c.id}
                        className="border-b border-carbon/5 last:border-b-0"
                      >
                        <Td className="whitespace-nowrap text-carbon/70">
                          {formatDateLong(c.date)}
                        </Td>
                        <Td>
                          <Link
                            href={`/admin/clases/${c.id}`}
                            className="font-medium text-carbon hover:text-terracota"
                          >
                            {c.title}
                          </Link>
                        </Td>
                        <Td className="text-carbon/80">
                          {c.categoryEvent === "eventos" ? (
                            "—"
                          ) : (
                            <span className="font-mono">
                              {c.spotsLeft}/{c.totalSpots}
                            </span>
                          )}
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Accesos directos */}
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/reservas"
          className="block border border-carbon/10 bg-white p-6 transition hover:border-terracota"
        >
          <p className="font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow text-terracota">
            Reservas
          </p>
          <p className="mt-3 font-display text-xl text-carbon">
            Ver y gestionar reservas
          </p>
          <p className="mt-2 font-body text-[0.85rem] text-carbon/60">
            Marcar como pagadas, cancelar, exportar.
          </p>
        </Link>
        <Link
          href="/admin/clases"
          className="block border border-carbon/10 bg-white p-6 transition hover:border-terracota"
        >
          <p className="font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow text-terracota">
            Calendario
          </p>
          <p className="mt-3 font-display text-xl text-carbon">
            Clases y eventos
          </p>
          <p className="mt-2 font-body text-[0.85rem] text-carbon/60">
            Cargar fechas, cupos y eventos privados confirmados.
          </p>
        </Link>
        <Link
          href="/admin/inquiries"
          className="block border border-carbon/10 bg-white p-6 transition hover:border-terracota"
        >
          <p className="font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow text-terracota">
            Consultas
          </p>
          <p className="mt-3 font-display text-xl text-carbon">
            Mensajes recibidos
          </p>
          <p className="mt-2 font-body text-[0.85rem] text-carbon/60">
            Contacto, eventos privados (solicitudes) y alquiler del espacio.
          </p>
        </Link>
      </div>
    </div>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function MetricCard({
  href,
  label,
  value,
  hint,
}: {
  href: string;
  label: string;
  value: number;
  hint: string;
}) {
  const highlight = value > 0;
  return (
    <Link
      href={href}
      className={[
        "block border p-5 transition",
        highlight
          ? "border-terracota/40 bg-terracota/5 hover:border-terracota"
          : "border-carbon/10 bg-white hover:border-carbon/30",
      ].join(" ")}
    >
      <p className="font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow text-carbon/55">
        {label}
      </p>
      <p
        className={[
          "mt-2 font-display text-3xl",
          highlight ? "text-terracota" : "text-carbon",
        ].join(" ")}
      >
        {value}
      </p>
      <p className="mt-2 font-body text-[0.8rem] text-carbon/55">{hint}</p>
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
