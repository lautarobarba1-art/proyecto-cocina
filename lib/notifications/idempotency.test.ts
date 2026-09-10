import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildReservaConfirmadaKey,
  buildPagoConfirmadoKey,
  buildCancelacionKey,
  buildRecordatorioKey,
  buildReprogramacionKey,
  buildReservaNuevaAdminKey,
  buildConsultaNuevaAdminKey,
  buildResumenAdminKey,
  buildBajaOcupacionKey,
  buildDeduplicationKey,
  eventTypeFromKey,
} from "./idempotency.ts";

test("buildReservaConfirmadaKey es determinista por reserva", () => {
  const a = buildReservaConfirmadaKey("res-1");
  const b = buildReservaConfirmadaKey("res-1");
  assert.equal(a, b);
  assert.equal(a, "reserva_confirmada:res-1");
});

test("buildPagoConfirmadoKey y buildCancelacionKey difieren entre sí para la misma reserva", () => {
  const pago = buildPagoConfirmadoKey("res-1");
  const cancel = buildCancelacionKey("res-1");
  assert.notEqual(pago, cancel);
});

test("buildRecordatorioKey cambia si cambia la fecha de la clase (reprogramación)", () => {
  const original = buildRecordatorioKey("res-1", "2026-08-01", "10:00:00");
  const reprogramada = buildRecordatorioKey("res-1", "2026-08-05", "10:00:00");
  assert.notEqual(original, reprogramada);
});

test("buildRecordatorioKey cambia si cambia el horario aunque la fecha sea la misma", () => {
  const original = buildRecordatorioKey("res-1", "2026-08-01", "10:00:00");
  const reprogramada = buildRecordatorioKey("res-1", "2026-08-01", "15:00:00");
  assert.notEqual(original, reprogramada);
});

test("buildRecordatorioKey es estable para la misma reserva+fecha+horario (dedup de reintentos del cron)", () => {
  const a = buildRecordatorioKey("res-1", "2026-08-01", "10:00:00");
  const b = buildRecordatorioKey("res-1", "2026-08-01", "10:00:00");
  assert.equal(a, b);
});

test("buildReprogramacionKey: dos reprogramaciones distintas de la misma reserva generan claves distintas", () => {
  const primera = buildReprogramacionKey({
    reservationId: "res-1",
    oldDate: "2026-08-01",
    oldStartTime: "10:00",
    oldEndTime: "12:00",
    newDate: "2026-08-05",
    newStartTime: "10:00",
    newEndTime: "12:00",
  });
  const segunda = buildReprogramacionKey({
    reservationId: "res-1",
    oldDate: "2026-08-05",
    oldStartTime: "10:00",
    oldEndTime: "12:00",
    newDate: "2026-08-10",
    newStartTime: "15:00",
    newEndTime: "17:00",
  });
  assert.notEqual(primera, segunda);
});

test("buildReprogramacionKey: la misma transición reenviada produce la misma clave (idempotencia del PATCH)", () => {
  const params = {
    reservationId: "res-1",
    oldDate: "2026-08-01",
    oldStartTime: "10:00",
    oldEndTime: "12:00",
    newDate: "2026-08-05",
    newStartTime: "10:00",
    newEndTime: "12:00",
  };
  assert.equal(buildReprogramacionKey(params), buildReprogramacionKey({ ...params }));
});

test("buildReprogramacionKey: distintas reservas con la misma transición no colisionan", () => {
  const base = {
    oldDate: "2026-08-01",
    oldStartTime: "10:00",
    oldEndTime: "12:00",
    newDate: "2026-08-05",
    newStartTime: "10:00",
    newEndTime: "12:00",
  };
  const keyA = buildReprogramacionKey({ reservationId: "res-A", ...base });
  const keyB = buildReprogramacionKey({ reservationId: "res-B", ...base });
  assert.notEqual(keyA, keyB);
});

test("buildDeduplicationKey delega correctamente según eventType", () => {
  assert.equal(
    buildDeduplicationKey({ eventType: "reserva_confirmada", reservationId: "res-1" }),
    buildReservaConfirmadaKey("res-1"),
  );
  assert.equal(
    buildDeduplicationKey({
      eventType: "recordatorio",
      reservationId: "res-1",
      classDateISO: "2026-08-01",
      classStartTime: "10:00:00",
    }),
    buildRecordatorioKey("res-1", "2026-08-01", "10:00:00"),
  );
});

test("eventTypeFromKey reconoce el prefijo de cada tipo de evento", () => {
  assert.equal(eventTypeFromKey("reserva_confirmada:res-1"), "reserva_confirmada");
  assert.equal(eventTypeFromKey("recordatorio:res-1:2026-08-01:10:00:00"), "recordatorio");
  assert.equal(eventTypeFromKey("reprogramacion:res-1:abcdef1234567890"), "reprogramacion");
  assert.equal(eventTypeFromKey("algo_desconocido:res-1"), null);
});

test("buildReservaNuevaAdminKey es determinista por reserva y distinta de reserva_confirmada", () => {
  const a = buildReservaNuevaAdminKey("res-1");
  const b = buildReservaNuevaAdminKey("res-1");
  assert.equal(a, b);
  assert.equal(a, "reserva_nueva_admin:res-1");
  assert.notEqual(a, buildReservaConfirmadaKey("res-1"));
});

test("buildConsultaNuevaAdminKey es determinista por inquiry", () => {
  const a = buildConsultaNuevaAdminKey("inq-1");
  const b = buildConsultaNuevaAdminKey("inq-1");
  assert.equal(a, b);
  assert.equal(a, "consulta_nueva_admin:inq-1");
});

test("eventTypeFromKey reconoce los eventos de aviso a la admin", () => {
  assert.equal(eventTypeFromKey("reserva_nueva_admin:res-1"), "reserva_nueva_admin");
  assert.equal(eventTypeFromKey("consulta_nueva_admin:inq-1"), "consulta_nueva_admin");
});

test("buildResumenAdminKey es una clave por fecha", () => {
  assert.equal(buildResumenAdminKey("2026-09-10"), "resumen_admin:2026-09-10");
  assert.notEqual(
    buildResumenAdminKey("2026-09-10"),
    buildResumenAdminKey("2026-09-11"),
  );
});

test("buildBajaOcupacionKey es una clave por clase", () => {
  assert.equal(buildBajaOcupacionKey("class-1"), "baja_ocupacion:class-1");
});

test("eventTypeFromKey reconoce los eventos proactivos al admin", () => {
  assert.equal(eventTypeFromKey("resumen_admin:2026-09-10"), "resumen_admin");
  assert.equal(eventTypeFromKey("baja_ocupacion:class-1"), "baja_ocupacion");
});
