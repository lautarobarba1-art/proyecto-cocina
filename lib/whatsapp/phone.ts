export interface PhoneValidationResult {
  valid: boolean;
  /**
   * Formato que espera el campo `to` de la Graph API para AR: código de país
   * 54 + área + abonado, sin "+" y sin el "9" (no es E.164 estricto — ver
   * comentario de `normalizeArgentinePhone`). `null` si no es válido.
   */
  e164: string | null;
  reason?: string;
}

const INVALID: (reason: string) => PhoneValidationResult = (reason) => ({
  valid: false,
  e164: null,
  reason,
});

/**
 * Normaliza y valida un teléfono argentino al formato que espera el campo
 * `to` de la Cloud API de WhatsApp: código de país 54 + área + abonado (10
 * dígitos), SIN el "9" que sí lleva el E.164 "oficial" para celulares
 * argentinos.
 *
 * Esta es una normalización heurística, no un parser completo por área
 * (no hay tabla de códigos de área): cubre los formatos más comunes con los
 * que la gente escribe su celular en un formulario web. Números que no
 * calcen con ninguno de estos patrones se marcan `valid:false` en vez de
 * lanzar — reservas históricas sin teléfono o con datos sucios no deben
 * romper nada río abajo (ver AGENTS feedback punto 10).
 *
 * Verificado con un envío real (2026-07-11) contra el número de prueba de
 * Meta: un destinatario argentino verificado solo aceptó el mensaje con el
 * código de país seguido del número (sin "9"); el mismo destinatario con
 * "549..." fue rechazado por Meta con el error 131030 "Recipient phone
 * number not in allowed list". Meta dejó de requerir el "9" para mensajería (no para
 * llamadas) en números argentinos hace varios años; este código antes lo
 * agregaba por error, replicando el formato de marcación telefónica en vez
 * del que realmente espera la Graph API.
 */
export function normalizeArgentinePhone(
  raw: string | null | undefined,
): PhoneValidationResult {
  if (raw == null) return INVALID("empty");

  const trimmed = raw.trim();
  if (trimmed === "") return INVALID("empty");

  let digits = trimmed.replace(/[\s\-().]/g, "");

  if (digits.startsWith("+")) {
    digits = digits.slice(1);
  } else if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  if (!/^\d+$/.test(digits)) {
    return INVALID("non_numeric");
  }

  let rest: string;
  if (digits.startsWith("54")) {
    rest = digits.slice(2);
  } else {
    // Sin código de país: puede venir con el "0" de larga distancia local.
    rest = digits.startsWith("0") ? digits.slice(1) : digits;
  }

  if (rest.startsWith("9")) {
    rest = rest.slice(1);
  }

  let areaAndSubscriber: string;
  if (rest.length === 10) {
    // area (2-4 dígitos) + abonado, ya sin "15" — formato esperado.
    areaAndSubscriber = rest;
  } else if (rest.length === 12) {
    // Puede tener un "15" insertado entre el código de área y el abonado
    // (marcación doméstica vieja de celular). Probamos las posiciones de
    // corte plausibles para códigos de área de 2 a 4 dígitos.
    const candidate = stripDomesticMobilePrefix(rest);
    if (!candidate) return INVALID("unrecognized_format");
    areaAndSubscriber = candidate;
  } else {
    return INVALID("unrecognized_length");
  }

  const e164 = `54${areaAndSubscriber}`;
  if (!/^54\d{10}$/.test(e164)) {
    return INVALID("unrecognized_format");
  }

  return { valid: true, e164 };
}

function stripDomesticMobilePrefix(rest: string): string | null {
  for (const areaLen of [2, 3, 4]) {
    const area = rest.slice(0, areaLen);
    const maybe15 = rest.slice(areaLen, areaLen + 2);
    const subscriber = rest.slice(areaLen + 2);
    if (maybe15 === "15" && area.length + subscriber.length === 10) {
      return area + subscriber;
    }
  }
  return null;
}

/** Formato legible para logs/UI (no para enviar a la API). */
export function formatE164ForDisplay(e164: string): string {
  return `+${e164}`;
}
