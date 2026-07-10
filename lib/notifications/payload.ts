/**
 * El payload de `notification_log` debe reproducir SOLO las variables mínimas
 * usadas en la plantilla/email de una notificación — nunca tokens, headers,
 * secretos, ni la respuesta completa de un proveedor. Esta sanitización es un
 * segundo cinturón de seguridad además de la disciplina del llamador: redacta
 * por nombre de clave cualquier cosa que huela a credencial, y rechaza valores
 * anidados (objetos) porque en la práctica esa es la forma más común en que
 * termina colándose una respuesta completa del proveedor o un objeto de
 * headers. Por ahora el payload solo soporta pares clave/valor planos —
 * cuando se conecten los eventos reales (Etapa 2+) esto se puede ampliar si
 * hace falta estructura, con una revisión explícita de qué se permite anidar.
 */

const FORBIDDEN_KEY_PATTERN = /token|secret|authorization|password|api[-_]?key|cookie|header/i;

export function sanitizeNotificationPayload(
  payload: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!payload) return {};

  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (FORBIDDEN_KEY_PATTERN.test(key)) continue;
    if (value === undefined) continue;
    if (typeof value === "object" && value !== null) continue;
    if (typeof value === "function") continue;
    clean[key] = value;
  }
  return clean;
}
