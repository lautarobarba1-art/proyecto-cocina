/**
 * Zona horaria comercial de Menesteres. `classes.date`/`start_time`/`end_time`
 * son columnas naive (sin zona) en Postgres: por convención del schema, ya
 * representan hora local de Argentina, no UTC. Por eso estos formatters NO
 * pasan por `Date`/`Intl` con conversión de zona — eso es justamente lo que
 * podría introducir un corrimiento de día si el runtime del servidor (Vercel)
 * no está en la misma zona. Formatear los componentes numéricos directamente
 * es la forma más robusta de no depender del huso horario del proceso.
 */
export const BUSINESS_TIMEZONE = "America/Argentina/Buenos_Aires";

const MONTHS_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** isoDate: "YYYY-MM-DD" (tal como viene de `classes.date`). */
export function formatClassDateLong(isoDate: string | null | undefined): string {
  if (!isoDate) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  if (!match) return "";
  const [, yStr, mStr, dStr] = match;
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);
  if (!y || !m || !d || m < 1 || m > 12) return "";
  return `${d} de ${MONTHS_ES[m - 1]} de ${y}`;
}

/** startTime/endTime: "HH:MM:SS" (tal como vienen de `classes.start_time`/`end_time`). */
export function formatClassTimeRange(
  startTime: string | null | undefined,
  endTime: string | null | undefined,
): string {
  const fmt = (t: string | null | undefined) => (t ?? "").slice(0, 5);
  return `${fmt(startTime)} - ${fmt(endTime)}`;
}
