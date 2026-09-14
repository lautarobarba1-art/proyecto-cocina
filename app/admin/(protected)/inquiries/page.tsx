import { getSupabaseAdmin } from "@/lib/supabase/server";
import { InquiryActions } from "./InquiryActions";
import { PageHeader } from "../_shared/PageHeader";
import { SummaryPill } from "../_shared/SummaryPill";
import { SegmentedFilter } from "../_shared/SegmentedFilter";
import { StatusBadge, type StatusTone } from "../_shared/StatusBadge";
import { TableWrapper, Th, Td, TableEmptyState } from "../_shared/Table";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Consultas · Admin Menesteres",
};

// ─── Tipos ──────────────────────────────────────────────────────────────────

type InquiryStatus = "new" | "read" | "archived";
type InquiryType = "contact" | "espacio" | "eventos";

interface Inquiry {
  id: string;
  type: InquiryType;
  customerName: string;
  customerEmail: string;
  payload: Record<string, string>;
  status: InquiryStatus;
  createdAt: string;
}

// ─── Query ──────────────────────────────────────────────────────────────────

async function getInquiries(): Promise<Inquiry[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("inquiries")
    .select("id, type, customer_name, customer_email, payload, status, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[getInquiries]", error);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    type: row.type as InquiryType,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    payload: (row.payload ?? {}) as Record<string, string>,
    status: row.status as InquiryStatus,
    createdAt: row.created_at,
  }));
}

// ─── Helpers ────────────────────────────────────────────────────────────────

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

function typeLabel(type: InquiryType): string {
  if (type === "espacio") return "Espacio";
  if (type === "eventos") return "Evento privado";
  return "Contacto";
}

function typeTone(type: InquiryType): StatusTone {
  if (type === "espacio") return "olive";
  if (type === "eventos") return "brand";
  return "neutral";
}

function statusLabel(status: InquiryStatus): string {
  if (status === "new") return "Nueva";
  if (status === "read") return "Leída";
  return "Archivada";
}

function statusTone(status: InquiryStatus): StatusTone {
  if (status === "new") return "brand";
  if (status === "read") return "success";
  return "neutral";
}

interface PageProps {
  searchParams: Promise<{ tipo?: string }>;
}

export default async function InquiriesAdminPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const tipoFiltro = params.tipo ?? "todas";

  const allInquiries = await getInquiries();
  const inquiries =
    tipoFiltro === "todas"
      ? allInquiries
      : allInquiries.filter((i) => i.type === tipoFiltro);

  const counts = {
    total: allInquiries.length,
    new: allInquiries.filter((i) => i.status === "new").length,
    read: allInquiries.filter((i) => i.status === "read").length,
    archived: allInquiries.filter((i) => i.status === "archived").length,
    eventos: allInquiries.filter((i) => i.type === "eventos").length,
  };

  return (
    <div>
      <PageHeader
        eyebrow="Panel · Consultas"
        title="Consultas recibidas"
        description="Contacto general, eventos privados y alquiler del espacio."
        actions={
          <>
            <SummaryPill label="Total" value={counts.total} />
            <SummaryPill
              label="Nuevas"
              value={counts.new}
              tone={counts.new > 0 ? "brand" : "neutral"}
            />
            <SummaryPill label="Eventos" value={counts.eventos} />
            <SummaryPill label="Leídas" value={counts.read} />
            <SummaryPill label="Archivadas" value={counts.archived} />
          </>
        }
      />

      <div className="mt-8">
        <SegmentedFilter
          options={[
            { href: "/admin/inquiries?tipo=todas", label: "Todas", active: tipoFiltro === "todas" },
            { href: "/admin/inquiries?tipo=eventos", label: "Eventos", active: tipoFiltro === "eventos" },
            { href: "/admin/inquiries?tipo=espacio", label: "Espacio", active: tipoFiltro === "espacio" },
            { href: "/admin/inquiries?tipo=contact", label: "Contacto", active: tipoFiltro === "contact" },
          ]}
        />
      </div>

      {inquiries.length === 0 ? (
        <TableEmptyState>Todavía no hay consultas registradas.</TableEmptyState>
      ) : (
        <TableWrapper minWidth="680px" className="mt-10">
          <thead className="border-b border-carbon/10 bg-crema-light/40">
            <tr className="text-carbon/60">
              <Th>Fecha</Th>
              <Th>Tipo</Th>
              <Th>Cliente</Th>
              <Th>Mensaje</Th>
              <Th>Estado</Th>
              <Th>Acciones</Th>
            </tr>
          </thead>
          <tbody>
                {inquiries.map((inq) => (
                  <tr
                    key={inq.id}
                    className={[
                      "border-b border-carbon/5 last:border-b-0 align-top",
                      inq.status === "new" ? "bg-terracota/3" : "",
                    ].join(" ")}
                  >
                    <Td className="whitespace-nowrap text-carbon/55 text-[0.8rem]">
                      {formatDateTime(inq.createdAt)}
                    </Td>
                    <Td>
                      <StatusBadge tone={typeTone(inq.type)} size="sm">
                        {typeLabel(inq.type)}
                      </StatusBadge>
                    </Td>
                    <Td>
                      <div className="font-medium text-carbon">
                        {inq.customerName}
                      </div>
                      <div className="text-carbon/60 text-[0.8rem]">
                        <a
                          href={`mailto:${inq.customerEmail}`}
                          className="hover:underline"
                        >
                          {inq.customerEmail}
                        </a>
                      </div>
                      {inq.type === "espacio" && inq.payload.marca && (
                        <div className="mt-1 text-carbon/50 text-[0.78rem]">
                          {inq.payload.marca}
                        </div>
                      )}
                      {(inq.type === "espacio" || inq.type === "eventos") &&
                        inq.payload.fecha && (
                        <div className="text-carbon/50 text-[0.78rem]">
                          Fecha tentativa: {inq.payload.fecha}
                        </div>
                      )}
                    </Td>
                    <Td className="max-w-[36ch]">
                      <p className="text-carbon/75 text-[0.83rem] leading-relaxed whitespace-pre-line wrap-break-word">
                        {inq.payload.mensaje ?? "—"}
                      </p>
                    </Td>
                    <Td>
                      <StatusBadge tone={statusTone(inq.status)}>
                        {statusLabel(inq.status)}
                      </StatusBadge>
                    </Td>
                    <Td>
                      <InquiryActions
                        inquiryId={inq.id}
                        status={inq.status}
                      />
                    </Td>
                  </tr>
                ))}
              </tbody>
        </TableWrapper>
      )}

      <p className="mt-8 font-body text-[0.78rem] text-carbon/40">
        Mostrando las últimas {inquiries.length} consultas.
      </p>
    </div>
  );
}
