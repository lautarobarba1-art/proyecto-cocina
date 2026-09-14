import { Resend } from "resend";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`[resend] Falta ${name} en variables de entorno`);
  return value;
}

export const FROM_EMAIL: string = requireEnv("FROM_EMAIL");

export const resend = new Resend(requireEnv("RESEND_API_KEY"));

/**
 * `ADMIN_EMAIL` admite una o más direcciones separadas por coma (ej.
 * "duena@x.com, socia@y.com") para que más de una persona reciba los avisos
 * al admin (comprobante subido, reserva/consulta nueva, resumen diario, baja
 * ocupación). Se centraliza acá porque tanto `notify.ts` (arma el
 * `recipient` que se loguea en notification_log) como este archivo (arma el
 * `to` que recibe Resend) necesitan la misma lista.
 *
 * Devuelve [] si la variable no está seteada — el llamador decide si eso
 * bloquea el envío (todas las funciones admin son fail-open: sin
 * ADMIN_EMAIL, no avisan a nadie pero no rompen el flujo que las disparó).
 */
export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAIL;
  if (!raw) return [];
  return raw
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}