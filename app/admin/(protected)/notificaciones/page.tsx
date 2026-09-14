import {
  getNotificationLogForAdmin,
  type NotificationEventType,
  type NotificationStatus,
} from "@/lib/admin/notificaciones-queries";
import { PageHeader } from "../_shared/PageHeader";
import { SummaryPill } from "../_shared/SummaryPill";
import { SegmentedFilter } from "../_shared/SegmentedFilter";
import { FilterDisclosure } from "../_shared/FilterDisclosure";
import { StatusBadge, type StatusTone } from "../_shared/StatusBadge";
import { TableWrapper, Th, Td, TableEmptyState } from "../_shared/Table";

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
    case "comprobante_subido":
      return "Comprobante subido";
    case "recordatorio_comprobante":
      return "Recordatorio de comprobante";
    case "reserva_nueva_admin":
      return "Reserva nueva (admin)";
    case "consulta_nueva_admin":
      return "Consulta nueva (admin)";
    case "resumen_admin":
      return "Resumen diario (admin)";
    case "baja_ocupacion":
      return "Baja ocupación (admin)";
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

function statusTone(status: NotificationStatus): StatusTone {
  if (status === "sent" || status === "delivered" || status === "read") {
    return "success";
  }
  if (status === "failed") return "danger";
  if (status === "processing") return "warning";
  return "neutral";
}

const EVENT_TYPES: { value: NotificationEventType | ""; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "reserva_confirmada", label: "Reserva confirmada" },
  { value: "pago_confirmado", label: "Pago confirmado" },
  { value: "recordatorio", label: "Recordatorio" },
  { value: "cancelacion", label: "Cancelación" },
  { value: "reprogramacion", label: "Reprogramación" },
  { value: "comprobante_subido", label: "Comprobante subido" },
  { value: "recordatorio_comprobante", label: "Recordatorio de comprobante" },
  { value: "reserva_nueva_admin", label: "Reserva nueva (admin)" },
  { value: "consulta_nueva_admin", label: "Consulta nueva (admin)" },
  { value: "resumen_admin", label: "Resumen diario (admin)" },
  { value: "baja_ocupacion", label: "Baja ocupación (admin)" },
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

  // Dos fetches separados a propósito: `notifications` es lo que se muestra
  // en la tabla (respeta el filtro de estado); `allForCounts` solo respeta el
  // filtro de evento, para que las pills de estado reflejen los totales
  // reales y no se pisen a 0 cuando hay un filtro de estado activo.
  const [notifications, allForCounts] = await Promise.all([
    getNotificationLogForAdmin(200, { eventType, status }),
    getNotificationLogForAdmin(200, { eventType }),
  ]);

  const counts = {
    total: allForCounts.length,
    sent: allForCounts.filter((n) => n.status === "sent").length,
    failed: allForCounts.filter((n) => n.status === "failed").length,
    processing: allForCounts.filter((n) => n.status === "processing").length,
    skipped: allForCounts.filter((n) => n.status === "skipped").length,
  };

  const needsAttention = allForCounts.filter(
    (n) => n.status === "failed" && (n.retryable === false || n.attemptCount >= n.maxAttempts),
  ).length;

  const activeSummaryParts = [
    EVENT_TYPES.find((e) => e.value === (evento ?? ""))?.label,
    STATUSES.find((s) => s.value === (estado ?? ""))?.label,
  ].filter((l): l is string => Boolean(l) && l !== "Todos");
  const activeSummary =
    activeSummaryParts.length > 0 ? activeSummaryParts.join(" · ") : "Todos";

  return (
    <div>
      <PageHeader
        eyebrow="Panel · Notificaciones"
        title="Historial de emails"
        description="Confirmaciones, pagos, recordatorios y cancelaciones enviados por email."
        actions={
          <>
            <SummaryPill label="Total" value={counts.total} />
            <SummaryPill label="Enviados" value={counts.sent} />
            <SummaryPill
              label="Fallidos"
              value={counts.failed}
              tone={counts.failed > 0 ? "danger" : "neutral"}
            />
            <SummaryPill label="Procesando" value={counts.processing} />
            <SummaryPill label="Omitidos" value={counts.skipped} />
          </>
        }
      />

      {needsAttention > 0 && (
        <div className="mt-6 border border-rojo/25 bg-rojo/5 p-4">
          <p className="font-sans text-[0.85rem] text-rojo">
            ⚠ {needsAttention} notificación{needsAttention === 1 ? "" : "es"} con falla permanente
            o reintentos agotados — requiere revisión manual (reenviar a mano si corresponde).
          </p>
        </div>
      )}

      <div className="mt-8">
        <FilterDisclosure label="Filtros" activeSummary={activeSummary}>
          <SegmentedFilter
            label="Evento"
            wrap
            options={EVENT_TYPES.map((opt) => {
              const params = new URLSearchParams();
              if (opt.value) params.set("evento", opt.value);
              if (estado) params.set("estado", estado);
              return {
                href: `/admin/notificaciones?${params.toString()}`,
                label: opt.label,
                active: (evento ?? "") === opt.value,
              };
            })}
          />

          <SegmentedFilter
            label="Estado"
            wrap
            options={STATUSES.map((opt) => {
              const params = new URLSearchParams();
              if (evento) params.set("evento", evento);
              if (opt.value) params.set("estado", opt.value);
              return {
                href: `/admin/notificaciones?${params.toString()}`,
                label: opt.label,
                active: (estado ?? "") === opt.value,
              };
            })}
          />
        </FilterDisclosure>
      </div>

      {notifications.length === 0 ? (
        <TableEmptyState>No hay notificaciones para los filtros seleccionados.</TableEmptyState>
      ) : (
        <TableWrapper minWidth="820px" className="mt-6">
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
                      <StatusBadge tone={statusTone(n.status)}>
                        {statusLabel(n.status)}
                      </StatusBadge>
                      {n.status === "failed" && n.retryable === false && (
                        <div className="mt-1 text-[0.72rem] text-rojo">Falla permanente</div>
                      )}
                      {n.status === "failed" &&
                        n.retryable === true &&
                        n.attemptCount >= n.maxAttempts && (
                          <div className="mt-1 text-[0.72rem] text-rojo">Reintentos agotados</div>
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
                          <div className="font-medium text-rojo">{n.errorCode}</div>
                          {n.errorMessage && <div className="italic">{n.errorMessage}</div>}
                        </>
                      ) : (
                        "—"
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
        </TableWrapper>
      )}

      <p className="mt-6 font-body text-[0.78rem] text-carbon/40">
        Mostrando {notifications.length} notificaci{notifications.length === 1 ? "ón" : "ones"}.
      </p>
      {notifications.length >= 200 && (
        <p className="mt-1 font-body text-[0.75rem] text-terracota-deep">
          ⚠ Se muestran solo las últimas 200. Usá los filtros de evento o estado para acotar.
        </p>
      )}
    </div>
  );
}
