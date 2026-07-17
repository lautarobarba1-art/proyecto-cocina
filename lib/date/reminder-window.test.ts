import { test } from "node:test";
import assert from "node:assert/strict";

import {
  classStartToUtcInstant,
  hoursUntilClassStart,
  isWithinReminderWindow,
  REMINDER_WINDOW_MIN_HOURS,
  REMINDER_WINDOW_MAX_HOURS,
} from "./reminder-window.ts";

test("classStartToUtcInstant suma el offset fijo de Buenos Aires (UTC-3)", () => {
  const utc = classStartToUtcInstant("2026-08-01", "10:00:00");
  assert.equal(utc.toISOString(), "2026-08-01T13:00:00.000Z");
});

test("classStartToUtcInstant cruza a el día siguiente en UTC sin corrimiento incorrecto", () => {
  const utc = classStartToUtcInstant("2026-08-01", "22:00:00");
  assert.equal(utc.toISOString(), "2026-08-02T01:00:00.000Z");
});

test("classStartToUtcInstant cruza de mes correctamente", () => {
  const utc = classStartToUtcInstant("2026-08-31", "22:30:00");
  assert.equal(utc.toISOString(), "2026-09-01T01:30:00.000Z");
});

test("classStartToUtcInstant cruza de año correctamente", () => {
  const utc = classStartToUtcInstant("2026-12-31", "23:00:00");
  assert.equal(utc.toISOString(), "2027-01-01T02:00:00.000Z");
});

test("hoursUntilClassStart da positivo para una clase futura y negativo para una pasada", () => {
  const now = new Date("2026-08-01T13:00:00.000Z");
  const enUnaHora = hoursUntilClassStart("2026-08-01", "11:00:00", now); // 14:00 UTC
  const haceUnaHora = hoursUntilClassStart("2026-08-01", "09:00:00", now); // 12:00 UTC
  assert.ok(Math.abs(enUnaHora - 1) < 1e-9);
  assert.ok(Math.abs(haceUnaHora - -1) < 1e-9);
});

test("isWithinReminderWindow: dentro de la ventana [23, 25) horas", () => {
  // Clase el 2026-08-02 10:00 BA = 2026-08-02T13:00:00Z
  const classDate = "2026-08-02";
  const classStart = "10:00:00";

  const exactamente23h = new Date("2026-08-01T14:00:00.000Z"); // 23h antes
  const exactamente24h = new Date("2026-08-01T13:00:00.000Z"); // 24h antes
  const exactamente25h = new Date("2026-08-01T12:00:00.000Z"); // 25h antes (límite exclusivo)
  const justoAntesDe23h = new Date("2026-08-01T14:00:00.001Z"); // 22.9999...h antes

  assert.equal(isWithinReminderWindow(classDate, classStart, exactamente23h), true);
  assert.equal(isWithinReminderWindow(classDate, classStart, exactamente24h), true);
  assert.equal(isWithinReminderWindow(classDate, classStart, exactamente25h), false);
  assert.equal(isWithinReminderWindow(classDate, classStart, justoAntesDe23h), false);
});

test("isWithinReminderWindow: fuera de la ventana (clase pasada o muy lejana)", () => {
  const classDate = "2026-08-02";
  const classStart = "10:00:00";

  const claseYaPaso = new Date("2026-08-02T14:00:00.000Z"); // -1h
  const muyLejos = new Date("2026-07-20T13:00:00.000Z"); // muchos días antes

  assert.equal(isWithinReminderWindow(classDate, classStart, claseYaPaso), false);
  assert.equal(isWithinReminderWindow(classDate, classStart, muyLejos), false);
});

test("las constantes de ventana son las esperadas (~24h con margen de ±1h)", () => {
  assert.equal(REMINDER_WINDOW_MIN_HOURS, 23);
  assert.equal(REMINDER_WINDOW_MAX_HOURS, 25);
});
