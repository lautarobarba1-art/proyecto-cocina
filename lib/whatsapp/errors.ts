/**
 * Clasificación inicial de errores de envío de WhatsApp (ver `SendOutcome`
 * "error" en lib/whatsapp/client.ts). Solo distingue recuperable/permanente
 * para dejarlo persistido correctamente en `notification_log`
 * (`retryable`) — el worker que efectivamente reintente es de una etapa
 * posterior, acá no se reintenta nada todavía.
 *
 * Recuperables: timeout, error de red, HTTP 429, HTTP 5xx.
 * No recuperables (default para cualquier otro código, incluyendo los
 * códigos de error propios de Meta como 190=token inválido o
 * 100=parámetro/plantilla inválida): todo lo demás. Es a propósito
 * conservador — un código que no reconocemos se trata como permanente para
 * no reintentar indefinidamente algo que capaz nunca se va a resolver solo.
 */

const RETRYABLE_ERROR_CODES = new Set(["network_error", "timeout"]);

function isRetryableHttpStatus(code: string): boolean {
  const n = Number(code);
  return Number.isInteger(n) && (n === 429 || (n >= 500 && n <= 599));
}

export interface WhatsAppErrorClassification {
  retryable: boolean;
}

export function classifyWhatsAppError(
  errorCode: string | null | undefined,
): WhatsAppErrorClassification {
  if (!errorCode) return { retryable: false };
  if (RETRYABLE_ERROR_CODES.has(errorCode)) return { retryable: true };
  if (isRetryableHttpStatus(errorCode)) return { retryable: true };
  return { retryable: false };
}
