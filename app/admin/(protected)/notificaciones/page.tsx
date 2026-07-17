import Link from "next/link";
import {
  getNotificationLogForAdmin,
  type NotificationEventType,
  type NotificationStatus,
} from "@/lib/admin/notificaciones-queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Notificaciones · Admin Menesteres",
};

function formatDateTime(iso: string): string {
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

function eventTypeLabel(eventType: NotificationEventType): string {
  switch (eventType) {
    case "reserva_confirmada":
      return "Reserva confirmada";
    case "pago_confirmado":
      return "Pago confirmado";
    case "recordatorio":
      return "Recordatorio";
    case "cancelacion":
      return "Cancelación";
    case "reprogramacion":
      return "Reprogramación";
  }
}

function statusLabel(status: NotificationStatus): string {
  switch (status) {
    case "processing":
      return "Procesando";
    case "sent":
      return "Enviado";
    case "delivered":
      return "Entregado";
    case "read":
      return "Leído";
    case "failed":
      return "Fallido";
    case "skipped":
      return "Omitido";
  }
}

function statusClass(status: NotificationStatus): string {
  if (status === "sent" || status === "delivered" || status === "read") {
    return "bg-green-100 text-green-900 border-green-300";
  }
  if (status === "failed") {
    return "bg-red-50 text-red-800 border-red-200";
  }
  if (status === "processing") {
    return "bg-yellow-100 text-yellow-900 border-yellow-300";
  }
  return "bg-gray-100 text-gray-700 border-gray-300";
}

const EVENT_TYPES: { value: NotificationEventType | ""; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "reserva_confirmada", label: "Reserva confirmada" },
  { value: "pago_confirmado", label: "Pago confirmado" },
  { value: "recordatorio", label: "Recordatorio" },
  { value: "cancelacion", label: "Cancelación" },
  { value: "reprogramacion", label: "Reprogramación" },
];

const STATUSES: { value: NotificationStatus | ""; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "sent", label: "Enviados" },
  { value: "failed", label: "Fallidos" },
  { value: "processing", label: "Procesando" },
  { value: "skipped", label: "Omitidos" },
];

interface PageProps {
  searchParams: Promise<{ evento?: string; estado?: string }>;
}

export default async function NotificacionesAdminPage({ searchParams }: PageProps) {
  const { evento, estado } = await searchParams;

  const eventType = EVENT_TYPES.some((e) => e.value === evento)
    ? (evento as NotificationEventType | undefined)
    : undefined;
  const status = STATUSES.some((s) => s.value === estado)
    ? (estado as NotificationStatus | undefined)
    : undefined;

  const notifications = await getNotificationLogForAdmin(200, { eventType, status });

  const counts = {
    total: notifications.length,
    sent: notifications.filter((n) => n.status === "sent").length,
    failed: notifications.filter((n) => n.status === "failed").length,
    processing: notifications.filter((n) => n.status === "processing").length,
    skipped: notifications.filter((n) => n.status === "skipped").length,
  };

  const needsAttention = notifications.filter(
    (n) => n.status === "failed" && (n.retryable === false || n.attemptCount >= n.maxAttempts),
  ).length;

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow text-terracota">
            Panel · Notificaciones
          </p>
          <h1 className="mt-3 font-display text-3xl font-normal tracking-tightish text-carbon">
            Historial de emails
          </h1>
          <p className="mt-2 font-body text-[0.85rem] text-carbon/55">
            Confirmaciones, pagos, recordatorios y cancelaciones enviados por email.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <SummaryPill label="Total" value={counts.total} />
          <SummaryPill label="Enviados" value={counts.sent} />
          <SummaryPill label="Fallidos" value={counts.failed} highlight={counts.failed > 0} />
          <SummaryPill label="Procesando" value={counts.processing} />
          <SummaryPill label="Omitidos" value={counts.skipped} />
        </div>
      </header>

      {needsAttention > 0 && (
        <div className="mt-6 border border-red-200 bg-red-50 p-4">
          <p className="font-sans text-[0.85rem] text-red-800">
            ⚠ {needsAttention} notificación{needsAttention === 1 ? "" : "es"} con falla permanente
            o reintentos agotados — requiere revisión manual (reenviar a mano si corresponde).
          </p>
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-end gap-6">
        <div>
          <p className="font-mono text-[0.65rem] uppercase tracking-eyebrow text-carbon/55 mb-1.5">
            Evento
          </p>
          <div className="flex flex-wrap gap-1">
            {EVENT_TYPES.map((opt) => {
              const isActive = (evento ?? "") === opt.value;
              const params = new URLSearchParams();
              if (opt.value) params.set("evento", opt.value);
              if (estado) params.set("estado", estado);
              const href = `/admin/notificaciones?${params.toString()}`;

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

        <div>
          <p className="font-mono text-[0.65rem] uppercase tracking-eyebrow text-carbon/55 mb-1.5">
            Estado
          </p>
          <div className="flex flex-wrap gap-1">
            {STATUSES.map((opt) => {
              const isActive = (estado ?? "") === opt.value;
              const params = new URLSearchParams();
              if (evento) params.set("evento", evento);
              if (opt.value) params.set("estado", opt.value);
              const href = `/admin/notificaciones?${params.toString()}`;

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
      </div>

      {notifications.length === 0 ? (
        <div className="mt-10 border border-dashed border-carbon/20 bg-white p-12 text-center">
          <p className="font-body text-[0.95rem] text-carbon/60">
            No hay notificaciones para los filtros seleccionados.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden border border-carbon/10 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left font-sans text-[0.85rem]">
              <thead className="border-b border-carbon/10 bg-crema-light/40">
                <tr className="text-carbon/60">
                  <Th>Fecha</Th>
                  <Th>Evento</Th>
                  <Th>Destinatario</Th>
                  <Th>Estado</Th>
                  <Th>Intentos</Th>
                  <Th>Próximo reintento</Th>
                  <Th>Error</Th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((n) => (
                  <tr key={n.id} className="border-b border-carbon/5 last:border-b-0 align-top">
                    <Td className="text-carbon/60 whitespace-nowrap text-[0.8rem]">
                      {formatDateTime(n.createdAt)}
                    </Td>
                    <Td className="text-carbon/80">{eventTypeLabel(n.eventType)}</Td>
                    <Td className="text-carbon/80">{n.recipient}</Td>
                    <Td>
                      <span
                        className={[
                          "inline-block rounded border px-2 py-1 text-[0.72rem] font-medium uppercase tracking-wide",
                          statusClass(n.status),
                        ].join(" ")}
                      >
                        {statusLabel(n.status)}
                      </span>
                      {n.status === "failed" && n.retryable === false && (
                        <div className="mt-1 text-[0.72rem] text-red-700">Falla permanente</div>
                      )}
                      {n.status === "failed" &&
                        n.retryable === true &&
                        n.attemptCount >= n.maxAttempts && (
                          <div className="mt-1 text-[0.72rem] text-red-700">Reintentos agotados</div>
                        )}
                    </Td>
                    <Td className="text-carbon/70 whitespace-nowrap">
                      {n.attemptCount}/{n.maxAttempts}
                    </Td>
                    <Td className="text-carbon/70 whitespace-nowrap text-[0.8rem]">
                      {n.nextRetryAt ? formatDateTime(n.nextRetryAt) : "—"}
                    </Td>
                    <Td className="max-w-[24ch] text-[0.78rem] text-carbon/60">
                      {n.errorCode ? (
                        <>
                          <div className="font-medium text-red-700">{n.errorCode}</div>
                          {n.errorMessage && <div className="italic">{n.errorMessage}</div>}
                        </>
                      ) : (
                        "—"
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="mt-6 font-body text-[0.78rem] text-carbon/40">
        Mostrando {notifications.length} notificaci{notifications.length === 1 ? "ón" : "ones"}.
      </p>
      {notifications.length >= 200 && (
        <p className="mt-1 font-body text-[0.75rem] text-amber-700">
          ⚠ Se muestran solo las últimas 200. Usá los filtros de evento o estado para acotar.
        </p>
      )}
    </div>
  );
}

function SummaryPill({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={[
        "border px-4 py-2",
        highlight ? "border-red-300 bg-red-50" : "border-carbon/10 bg-white",
      ].join(" ")}
    >
      <div className="font-mono text-[0.65rem] uppercase tracking-eyebrow text-carbon/55">
        {label}
      </div>
      <div
        className={[
          "font-display text-lg",
          highlight ? "text-red-800" : "text-carbon",
        ].join(" ")}
      >
        {value}
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
  return <td className={["px-4 py-3", className ?? ""].join(" ")}>{children}</td>;
}
