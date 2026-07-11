import type { WhatsAppTemplateComponent } from "./client.ts";

/**
 * Construye los `components` (parámetros posicionales del body) para cada
 * plantilla de WhatsApp. El NOMBRE de la plantilla nunca se hardcodea acá —
 * eso vive en `lib/whatsapp/config.ts` (`WHATSAPP_TEMPLATE_*`). Esto solo
 * define, para cada evento, cuántas variables hay, en qué orden, y valida
 * que estén completas y dentro de un largo razonable antes de armar el
 * payload que se manda a la Graph API.
 */

const MAX_VAR_LENGTH = 300;

function requiredVar(fieldName: string, value: string | null | undefined): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) {
    throw new Error(`[whatsapp/templates] falta la variable obligatoria "${fieldName}"`);
  }
  return trimmed.length > MAX_VAR_LENGTH ? trimmed.slice(0, MAX_VAR_LENGTH) : trimmed;
}

function textParam(value: string): { type: "text"; text: string } {
  return { type: "text", text: value };
}

export interface ReservaConfirmadaTemplateVars {
  customerName: string;
  className: string;
  classDate: string;
  classTime: string;
  spots: number;
}

/** Orden: nombre, clase, fecha, horario, cupos. */
export function buildReservaConfirmadaComponents(
  vars: ReservaConfirmadaTemplateVars,
): WhatsAppTemplateComponent[] {
  const customerName = requiredVar("customerName", vars.customerName);
  const className = requiredVar("className", vars.className);
  const classDate = requiredVar("classDate", vars.classDate);
  const classTime = requiredVar("classTime", vars.classTime);
  if (!Number.isInteger(vars.spots) || vars.spots < 1) {
    throw new Error("[whatsapp/templates] reserva_confirmada: spots debe ser un entero >= 1");
  }

  return [
    {
      type: "body",
      parameters: [
        textParam(customerName),
        textParam(className),
        textParam(classDate),
        textParam(classTime),
        textParam(String(vars.spots)),
      ],
    },
  ];
}

export interface PagoConfirmadoTemplateVars {
  customerName: string;
  className: string;
  classDate: string;
  classTime: string;
}

/** Orden: nombre, clase, fecha, horario. */
export function buildPagoConfirmadoComponents(
  vars: PagoConfirmadoTemplateVars,
): WhatsAppTemplateComponent[] {
  const customerName = requiredVar("customerName", vars.customerName);
  const className = requiredVar("className", vars.className);
  const classDate = requiredVar("classDate", vars.classDate);
  const classTime = requiredVar("classTime", vars.classTime);

  return [
    {
      type: "body",
      parameters: [
        textParam(customerName),
        textParam(className),
        textParam(classDate),
        textParam(classTime),
      ],
    },
  ];
}
