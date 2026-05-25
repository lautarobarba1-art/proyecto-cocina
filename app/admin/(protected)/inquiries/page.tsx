import { getSupabaseAdmin } from "@/lib/supabase/server";
import { InquiryActions } from "./InquiryActions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Consultas · Admin Menesteres",
};

// ─── Tipos ──────────────────────────────────────────────────────────────────

type InquiryStatus = "new" | "read" | "archived";
type InquiryType = "contact" | "espacio";

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
  });
}

function typeLabel(type: InquiryType): string {
  if (type === "espacio") return "Espacio";
  return "Contacto";
}

function typeClass(type: InquiryType): string {
  if (type === "espacio")
    return "bg-oliva/10 text-oliva border-oliva/30";
  return "bg-crema-deep/40 text-carbon/70 border-carbon/20";
}

function statusLabel(status: InquiryStatus): string {
  if (status === "new") return "Nueva";
  if (status === "read") return "Leída";
  return "Archivada";
}

function statusClass(status: InquiryStatus): string {
  if (status === "new")
    return "bg-terracota/10 text-terracota border-terracota/30";
  if (status === "read")
    return "bg-green-50 text-green-800 border-green-200";
  return "bg-gray-100 text-gray-500 border-gray-200";
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function InquiriesAdminPage() {
  const inquiries = await getInquiries();

  const counts = {
    total: inquiries.length,
    new: inquiries.filter((i) => i.status === "new").length,
    read: inquiries.filter((i) => i.status === "read").length,
    archived: inquiries.filter((i) => i.status === "archived").length,
  };

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[0.7rem] font-medium uppercase tracking-eyebrow text-terracota">
            Panel · Consultas
          </p>
          <h1 className="mt-3 font-display text-3xl font-normal tracking-tightish text-carbon">
            Consultas recibidas
          </h1>
          <p className="mt-2 font-body text-[0.85rem] text-carbon/55">
            Formularios de Contacto y Alquiler del espacio.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <SummaryPill label="Total" value={counts.total} />
          <SummaryPill label="Nuevas" value={counts.new} highlight />
          <SummaryPill label="Leídas" value={counts.read} />
          <SummaryPill label="Archivadas" value={counts.archived} />
        </div>
      </header>

      {inquiries.length === 0 ? (
        <div className="mt-10 border border-dashed border-carbon/20 bg-white p-12 text-center">
          <p className="font-body text-[0.95rem] text-carbon/60">
            Todavía no hay consultas registradas.
          </p>
        </div>
      ) : (
        <div className="mt-10 overflow-hidden border border-carbon/10 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-[0.85rem]">
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
                      <span
                        className={[
                          "inline-block rounded border px-2 py-0.5 text-[0.7rem] font-medium uppercase tracking-wide",
                          typeClass(inq.type),
                        ].join(" ")}
                      >
                        {typeLabel(inq.type)}
                      </span>
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
                      {inq.type === "espacio" && inq.payload.fecha && (
                        <div className="text-carbon/50 text-[0.78rem]">
                          Fecha evento: {inq.payload.fecha}
                        </div>
                      )}
                    </Td>
                    <Td className="max-w-[36ch]">
                      <p className="text-carbon/75 text-[0.83rem] leading-relaxed whitespace-pre-line wrap-break-word">
                        {inq.payload.mensaje ?? "—"}
                      </p>
                    </Td>
                    <Td>
                      <span
                        className={[
                          "inline-block rounded border px-2 py-1 text-[0.72rem] font-medium uppercase tracking-wide",
                          statusClass(inq.status),
                        ].join(" ")}
                      >
                        {statusLabel(inq.status)}
                      </span>
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
            </table>
          </div>
        </div>
      )}

      <p className="mt-8 font-body text-[0.78rem] text-carbon/40">
        Mostrando las últimas {inquiries.length} consultas.
      </p>
    </div>
  );
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────

function SummaryPill({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="border border-carbon/10 bg-white px-4 py-2">
      <div className="font-mono text-[0.65rem] uppercase tracking-eyebrow text-carbon/55">
        {label}
      </div>
      <div
        className={[
          "font-display text-lg",
          highlight && value > 0 ? "text-terracota" : "text-carbon",
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
  return (
    <td className={["px-4 py-3", className ?? ""].join(" ")}>{children}</td>
  );
}
