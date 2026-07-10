import { test } from "node:test";
import assert from "node:assert/strict";

import { sanitizeNotificationPayload } from "./payload.ts";

test("null/undefined devuelve objeto vacío", () => {
  assert.deepEqual(sanitizeNotificationPayload(null), {});
  assert.deepEqual(sanitizeNotificationPayload(undefined), {});
});

test("conserva pares clave/valor planos inofensivos", () => {
  const result = sanitizeNotificationPayload({
    customerName: "Ana",
    className: "Cocina italiana",
    spots: 2,
  });
  assert.deepEqual(result, { customerName: "Ana", className: "Cocina italiana", spots: 2 });
});

test("redacta claves que parecen credenciales sin importar mayúsculas/guiones", () => {
  const result = sanitizeNotificationPayload({
    customerName: "Ana",
    accessToken: "should-not-be-here",
    Authorization: "Bearer xyz",
    api_key: "secret-value",
    ApiKey: "secret-value-2",
    password: "hunter2",
    sessionCookie: "abc",
    requestHeaders: "x",
  });
  assert.deepEqual(result, { customerName: "Ana" });
});

test("descarta valores anidados (objetos/arrays) para no colar una respuesta completa del proveedor", () => {
  const result = sanitizeNotificationPayload({
    customerName: "Ana",
    providerResponse: { id: "wamid.123", raw: "everything" },
    tags: ["a", "b"],
  });
  assert.deepEqual(result, { customerName: "Ana" });
});

test("descarta funciones y valores undefined", () => {
  const result = sanitizeNotificationPayload({
    customerName: "Ana",
    callback: () => {},
    optional: undefined,
  });
  assert.deepEqual(result, { customerName: "Ana" });
});
