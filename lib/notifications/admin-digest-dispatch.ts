import type { SupabaseClient } from "@supabase/supabase-js";

import { notifyAdminDigest, type NotifyDeps } from "./notify.ts";
import { buenosAiresWallClock, buenosAiresDateInDays } from "../date/reminder-window.ts";
import { getStatusInfo } from "../admin/clases-status.ts";
import { siteContact } from "../site/contact.ts";
import type { EmailAdminDigestClase } from "../resend/template.ts";

/**
 * Resumen diario al admin. El cron `admin-checks` corre cada hora; este
 * dispatcher se auto-filtra a las 8:00 hora de Argentina y, si no hay nada
 * pendiente ni clases próximas, no manda nada (decisión del usuario: evitar
 * el email de "nada para reportar"). La dedup por fecha (`resumen_admin:<dateISO>`)
 * garantiza un solo email por día aunque el cron pegue varias veces a las 8.
 *
 * Hace las queries directo sobre el `supabase` recibido (mismo patrón que
 * payment-deadline-dispatch / reminder-dispatch) — no usa los helpers de
 * lib/admin/* porque esos resuelven `getSupabaseAdmin()` por su cuenta y con
 * el alias `@/`, que rompe los tests con `node --test`.
 */

const DIGEST_HOUR_AR = 8;
const PROXIMAS_DIAS = 7;

export interface DigestData {
  comprobantesPendientes: number;
  consultasNuevas: number;
  fallasPermanentes: number;
  proximasClases: EmailAdminDigestClase[];
}

export interface AdminDigestDeps extends NotifyDeps {
  /** Override de la recolección de datos, para tests. */
  gather?: () => Promise<DigestData>;
}

export interface AdminDigestResult {
  status: "sent" | "failed" | "skipped_hour" | "skipped_empty" | "not_claimed";
}

function formatDateLong(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

interface ClaseRow {
  id: string;
  title: string;
  date: string;
  start_time: string | null;
  total_spots: number;
  spots_left: number | null;
  category_event: "adultos" | "ninos" | "eventos";
  is_cancelled: boolean;
}

async function gatherFromDb(
  supabase: SupabaseClient,
  todayISO: string,
  limiteISO: string,
): Promise<DigestData> {
  const [comprobantes, consultas, clases, fallidas] = await Promise.all([
    supabase
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .not("comprobante_url", "is", null),
    supabase
      .from("inquiries")
      .select("id", { count: "exact", head: true })
      .eq("status", "new"),
    supabase
      .from("classes_with_availability")
      .select("id, title, date, start_time, total_spots, spots_left, category_event, is_cancelled")
      .gte("date", todayISO)
      .lte("date", limiteISO)
      .eq("is_cancelled", false),
    supabase
      .from("notification_log")
      .select("retryable, attempt_count, max_attempts")
      .eq("status", "failed")
      .limit(200),
  ]);

  const fallasPermanentes = (
    (fallidas.data ?? []) as Array<{
      retryable: boolean | null;
      attempt_count: number;
      max_attempts: number;
    }>
  ).filter((r) => r.retryable === false || r.attempt_count >= r.max_attempts).length;

  const proximasClases: EmailAdminDigestClase[] = ((clases.data ?? []) as ClaseRow[])
    .slice()
    .sort((a, b) =>
      `${a.date}T${a.start_time ?? ""}`.localeCompare(`${b.date}T${b.start_time ?? ""}`),
    )
    .map((c) => {
      const spotsLeft = c.spots_left ?? c.total_spots;
      return {
        title: c.title,
        dateLabel: formatDateLong(c.date),
        spotsLeft,
        totalSpots: c.total_spots,
        statusLabel: getStatusInfo({
          categoryEvent: c.category_event,
          isCancelled: c.is_cancelled,
          date: c.date,
          spotsLeft,
          totalSpots: c.total_spots,
        }).label,
        isEvento: c.category_event === "eventos",
      };
    });

  return {
    comprobantesPendientes: comprobantes.count ?? 0,
    consultasNuevas: consultas.count ?? 0,
    fallasPermanentes,
    proximasClases,
  };
}

export async function runAdminDigest(
  supabase: SupabaseClient,
  now: Date = new Date(),
  deps: AdminDigestDeps = {},
): Promise<AdminDigestResult> {
  const { hour, dateISO } = buenosAiresWallClock(now);
  if (hour !== DIGEST_HOUR_AR) return { status: "skipped_hour" };

  const limiteISO = buenosAiresDateInDays(PROXIMAS_DIAS, now);
  const data = deps.gather
    ? await deps.gather()
    : await gatherFromDb(supabase, dateISO, limiteISO);

  const hayAlgo =
    data.comprobantesPendientes > 0 ||
    data.consultasNuevas > 0 ||
    data.fallasPermanentes > 0 ||
    data.proximasClases.length > 0;

  if (!hayAlgo) return { status: "skipped_empty" };

  const result = await notifyAdminDigest(
    supabase,
    {
      dateISO,
      dateLabel: formatDateLong(dateISO),
      comprobantesPendientes: data.comprobantesPendientes,
      consultasNuevas: data.consultasNuevas,
      proximasClases: data.proximasClases,
      fallasPermanentes: data.fallasPermanentes,
      panelUrl: `${siteContact.siteUrl}/admin`,
    },
    deps,
  );

  if (result.email.outcome === "sent") return { status: "sent" };
  if (result.email.outcome === "not_claimed") return { status: "not_claimed" };
  return { status: "failed" };
}
