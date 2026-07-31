import { createHash } from "node:crypto";

import type { NotificationEventType } from "./types.ts";

/**
 * Claves de deduplicación por evento. Se usan junto con `channel` como
 * restricción única en `notification_log` (ver migración 20260709000001).
 *
 * Regla general: la clave identifica un EVENTO DE NEGOCIO concreto, no solo
 * "una reserva". Reintentar el mismo evento (mismo request reenviado, cron
 * que corre dos veces el mismo día, doble click del admin) debe producir la
 * misma clave. Un evento genuinamente distinto (otra reprogramación, otro
 * día de recordatorio) debe producir una clave distinta.
 */

export function buildReservaConfirmadaKey(reservationId: string): string {
  return `reserva_confirmada:${reservationId}`;
}

export function buildPagoConfirmadoKey(reservationId: string): string {
  return `pago_confirmado:${reservationId}`;
}

export function buildCancelacionKey(reservationId: string): string {
  return `cancelacion:${reservationId}`;
}

/**
 * Una reserva solo puede tener un comprobante subido (el endpoint de subida
 * rechaza un segundo intento si `comprobante_url` ya está seteado), así que
 * alcanza con la reservationId sola: no puede haber un segundo evento
 * legítimo de "comprobante subido" para la misma reserva.
 */
export function buildComprobanteSubidoKey(reservationId: string): string {
  return `comprobante_subido:${reservationId}`;
}

/**
 * A diferencia del recordatorio de clase, acá NO hace falta ningún
 * componente de fecha: una reserva pending sin comprobante tiene un único
 * `created_at` inmutable (no se reprograma), así que solo puede existir un
 * evento "recordatorio de comprobante" legítimo por reserva en toda su vida.
 * Incluir la fecha de ENVÍO (en vez de una fecha propia del evento) sería un
 * error: la ventana de envío (23-25hs desde created_at) puede caer a caballo
 * de la medianoche, y el cron corre cada hora — si una corrida cae de un
 * lado de la medianoche y la siguiente (misma reserva, todavía dentro de la
 * ventana) cae del otro lado, una clave basada en "hoy" cambiaría entre esas
 * dos corridas y produciría un segundo email para el mismo evento.
 */
export function buildRecordatorioComprobanteKey(reservationId: string): string {
  return `recordatorio_comprobante:${reservationId}`;
}

/**
 * classDateISO + classStartTime son la fecha/horario de la clase vigentes al
 * momento de armar la clave, no los de hoy. Si la clase se reprograma —
 * incluso a otro horario el mismo día — la clave cambia y el recordatorio
 * para el nuevo horario es un evento distinto: no queda "quemado" por un
 * recordatorio ya enviado para la fecha/horario viejos. Incluir el horario
 * (no solo la fecha) es necesario porque un cambio de horario sin cambio de
 * fecha, de otro modo, sería indistinguible del evento ya notificado.
 */
export function buildRecordatorioKey(
  reservationId: string,
  classDateISO: string,
  classStartTime: string,
): string {
  return `recordatorio:${reservationId}:${classDateISO}:${classStartTime}`;
}

export interface ReprogramacionKeyParams {
  reservationId: string;
  oldDate: string;
  oldStartTime: string;
  oldEndTime: string;
  newDate: string;
  newStartTime: string;
  newEndTime: string;
}

/**
 * La clave se arma a partir de la TRANSICIÓN (valor viejo -> valor nuevo), no
 * solo del valor nuevo. Esto permite que una clase se reprograme varias veces
 * para la misma reserva (cada transición es una clave distinta) y a la vez
 * deduplica un reintento exacto del mismo cambio. Como efecto secundario, si
 * la clase vuelve a una fecha/horario que ya tuvo antes, pero llegando desde
 * un valor intermedio distinto, se notifica igual (es información nueva para
 * el cliente, que en el medio se había enterado de otra fecha).
 */
export function buildReprogramacionKey(params: ReprogramacionKeyParams): string {
  const transition =
    `${params.oldDate}T${params.oldStartTime}-${params.oldEndTime}` +
    "->" +
    `${params.newDate}T${params.newStartTime}-${params.newEndTime}`;
  const hash = createHash("sha256").update(transition).digest("hex").slice(0, 16);
  return `reprogramacion:${params.reservationId}:${hash}`;
}

export type DeduplicationKeyBuilder =
  | { eventType: "reserva_confirmada"; reservationId: string }
  | { eventType: "pago_confirmado"; reservationId: string }
  | { eventType: "cancelacion"; reservationId: string }
  | {
      eventType: "recordatorio";
      reservationId: string;
      classDateISO: string;
      classStartTime: string;
    }
  | ({ eventType: "reprogramacion" } & ReprogramacionKeyParams)
  | { eventType: "comprobante_subido"; reservationId: string }
  | { eventType: "recordatorio_comprobante"; reservationId: string };

export function buildDeduplicationKey(params: DeduplicationKeyBuilder): string {
  switch (params.eventType) {
    case "reserva_confirmada":
      return buildReservaConfirmadaKey(params.reservationId);
    case "pago_confirmado":
      return buildPagoConfirmadoKey(params.reservationId);
    case "cancelacion":
      return buildCancelacionKey(params.reservationId);
    case "recordatorio":
      return buildRecordatorioKey(
        params.reservationId,
        params.classDateISO,
        params.classStartTime,
      );
    case "reprogramacion":
      return buildReprogramacionKey(params);
    case "comprobante_subido":
      return buildComprobanteSubidoKey(params.reservationId);
    case "recordatorio_comprobante":
      return buildRecordatorioComprobanteKey(params.reservationId);
    default: {
      const exhaustive: never = params;
      throw new Error(`Evento de notificación desconocido: ${JSON.stringify(exhaustive)}`);
    }
  }
}

export function eventTypeFromKey(key: string): NotificationEventType | null {
  const prefix = key.split(":", 1)[0];
  const known: NotificationEventType[] = [
    "reserva_confirmada",
    "pago_confirmado",
    "recordatorio",
    "cancelacion",
    "reprogramacion",
    "comprobante_subido",
    "recordatorio_comprobante",
  ];
  return (known as string[]).includes(prefix) ? (prefix as NotificationEventType) : null;
}
