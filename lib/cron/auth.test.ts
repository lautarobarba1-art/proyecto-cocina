import { test } from "node:test";
import assert from "node:assert/strict";

import { isValidCronRequest } from "./auth.ts";

const SECRET = "un-secreto-de-prueba-bien-largo";

test("acepta el header correcto", () => {
  assert.equal(isValidCronRequest(`Bearer ${SECRET}`, SECRET), true);
});

test("rechaza sin header", () => {
  assert.equal(isValidCronRequest(null, SECRET), false);
});

test("rechaza sin el prefijo Bearer", () => {
  assert.equal(isValidCronRequest(SECRET, SECRET), false);
});

test("rechaza un secreto incorrecto de la misma longitud", () => {
  const wrong = "x".repeat(SECRET.length);
  assert.equal(isValidCronRequest(`Bearer ${wrong}`, SECRET), false);
});

test("rechaza un secreto de longitud distinta sin lanzar excepción", () => {
  assert.equal(isValidCronRequest("Bearer corto", SECRET), false);
});

test("rechaza string vacío", () => {
  assert.equal(isValidCronRequest("", SECRET), false);
});
