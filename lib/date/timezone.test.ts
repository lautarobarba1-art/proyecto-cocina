import { test } from "node:test";
import assert from "node:assert/strict";

import { formatClassDateLong, formatClassTimeRange, BUSINESS_TIMEZONE } from "./timezone.ts";

test("BUSINESS_TIMEZONE es la zona comercial de Argentina", () => {
  assert.equal(BUSINESS_TIMEZONE, "America/Argentina/Buenos_Aires");
});

test("formatClassDateLong formatea una fecha ISO en español, sin depender de la zona del runtime", () => {
  assert.equal(formatClassDateLong("2026-08-01"), "1 de agosto de 2026");
  assert.equal(formatClassDateLong("2026-01-31"), "31 de enero de 2026");
  assert.equal(formatClassDateLong("2026-12-25"), "25 de diciembre de 2026");
});

test("formatClassDateLong no sufre corrimiento de día en bordes de mes/año (sin conversión UTC/local)", () => {
  // Si esto pasara por `new Date(y, m-1, d)` + toLocaleString con timeZone
  // implícito distinto al de construcción, un 1ro de enero podría mostrarse
  // como 31 de diciembre. Acá no hay Date de por medio, así que no puede pasar.
  assert.equal(formatClassDateLong("2027-01-01"), "1 de enero de 2027");
  assert.equal(formatClassDateLong("2026-12-31"), "31 de diciembre de 2026");
});

test("formatClassDateLong devuelve vacío para entradas vacías o mal formadas", () => {
  assert.equal(formatClassDateLong(""), "");
  assert.equal(formatClassDateLong(null), "");
  assert.equal(formatClassDateLong(undefined), "");
  assert.equal(formatClassDateLong("no-es-una-fecha"), "");
});

test("formatClassTimeRange recorta segundos y arma el rango", () => {
  assert.equal(formatClassTimeRange("10:00:00", "12:00:00"), "10:00 - 12:00");
  assert.equal(formatClassTimeRange("18:00", "21:00"), "18:00 - 21:00");
});

test("formatClassTimeRange tolera valores faltantes", () => {
  assert.equal(formatClassTimeRange(null, "12:00:00"), " - 12:00");
  assert.equal(formatClassTimeRange(undefined, undefined), " - ");
});
