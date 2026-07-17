import { timingSafeEqual } from "node:crypto";

/**
 * Valida el header `Authorization: Bearer <secret>` de un endpoint de cron
 * contra el secreto esperado, con comparación de tiempo constante (evita que
 * el tiempo de respuesta filtre información sobre cuántos caracteres del
 * secreto son correctos).
 */
export function isValidCronRequest(
  authHeader: string | null,
  expectedSecret: string,
): boolean {
  const prefix = "Bearer ";
  if (!authHeader || !authHeader.startsWith(prefix)) return false;

  const provided = Buffer.from(authHeader.slice(prefix.length));
  const expected = Buffer.from(expectedSecret);
  if (provided.length !== expected.length) return false;

  return timingSafeEqual(provided, expected);
}
