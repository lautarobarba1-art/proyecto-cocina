import { test } from "node:test";
import assert from "node:assert/strict";

import { normalizeArgentinePhone, formatE164ForDisplay } from "./phone.ts";

test("null/undefined/vacío se marcan inválidos sin lanzar (compatibilidad con reservas históricas)", () => {
  assert.deepEqual(normalizeArgentinePhone(null), { valid: false, e164: null, reason: "empty" });
  assert.deepEqual(normalizeArgentinePhone(undefined), { valid: false, e164: null, reason: "empty" });
  assert.deepEqual(normalizeArgentinePhone(""), { valid: false, e164: null, reason: "empty" });
  assert.deepEqual(normalizeArgentinePhone("   "), { valid: false, e164: null, reason: "empty" });
});

test("acepta E.164 completo con o sin '+' ", () => {
  assert.equal(normalizeArgentinePhone("+5491123456789").e164, "5491123456789");
  assert.equal(normalizeArgentinePhone("5491123456789").e164, "5491123456789");
});

test("acepta formato con prefijo internacional 00", () => {
  assert.equal(normalizeArgentinePhone("0054 9 11 2345-6789").e164, "5491123456789");
});

test("acepta número local con 0 de larga distancia + 15 de celular (Buenos Aires, área de 2 dígitos)", () => {
  const result = normalizeArgentinePhone("011 15-2345-6789");
  assert.equal(result.valid, true);
  assert.equal(result.e164, "5491123456789");
});

test("acepta número local sin el 15 (formato ya 'internacional' sin +54 9)", () => {
  const result = normalizeArgentinePhone("11 2345 6789");
  assert.equal(result.valid, true);
  assert.equal(result.e164, "5491123456789");
});

test("acepta área de 4 dígitos con 15 (ej. interior del país)", () => {
  // área ficticia de 4 dígitos "2954" + 15 + abonado de 6 dígitos = 12 dígitos totales
  const result = normalizeArgentinePhone("2954 15 123456");
  assert.equal(result.valid, true);
  assert.equal(result.e164, "5492954123456");
});

test("rechaza texto no numérico", () => {
  const result = normalizeArgentinePhone("no tengo whatsapp");
  assert.equal(result.valid, false);
  assert.equal(result.reason, "non_numeric");
});

test("rechaza longitudes que no calzan con ningún formato conocido", () => {
  const result = normalizeArgentinePhone("12345");
  assert.equal(result.valid, false);
  assert.equal(result.e164, null);
});

test("rechaza un número de 12 dígitos sin un '15' en posición plausible", () => {
  const result = normalizeArgentinePhone("110000000000");
  assert.equal(result.valid, false);
  assert.equal(result.reason, "unrecognized_format");
});

test("formatE164ForDisplay antepone '+' para mostrar en UI/logs", () => {
  assert.equal(formatE164ForDisplay("5491123456789"), "+5491123456789");
});
