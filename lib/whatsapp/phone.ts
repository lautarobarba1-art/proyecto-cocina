export interface PhoneValidationResult {
  valid: boolean;
  /** E.164 sin el "+" (formato que espera el campo `to` de la Graph API), o null si no es válido. */
  e164: string | null;
  reason?: string;
}

const INVALID: (reason: string) => PhoneValidationResult = (reason) => ({
  valid: false,
  e164: null,
  reason,
});

/**
 * Normaliza y valida un teléfono argentino a formato E.164 para WhatsApp
 * (54 9 + 10 dígitos = área + abonado, sin el "0" de larga distancia ni el
 * "15" de celular usado en la marcación doméstica vieja).
 *
 * Esta es una normalización heurística, no un parser completo por área
 * (no hay tabla de códigos de área): cubre los formatos más comunes con los
 * que la gente escribe su celular en un formulario web. Números que no
 * calcen con ninguno de estos patrones se marcan `valid:false` en vez de
 * lanzar — reservas históricas sin teléfono o con datos sucios no deben
 * romper nada río abajo (ver AGENTS feedback punto 10).
 *
 * IMPORTANTE (riesgo documentado en la auditoría): algunos números
 * argentinos requieren el "9" en la posición E.164 estándar, pero hay
 * inconsistencias reportadas en la Cloud API de WhatsApp con el dígito "9"
 * para AR. Antes de conectar esto a un envío real, probar contra el número
 * de test de Meta con casos reales.
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

  const e164 = `549${areaAndSubscriber}`;
  if (!/^549\d{10}$/.test(e164)) {
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
