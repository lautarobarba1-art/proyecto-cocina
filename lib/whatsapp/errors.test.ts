import { test } from "node:test";
import assert from "node:assert/strict";

import { classifyWhatsAppError } from "./errors.ts";

test("errores recuperables: timeout, red, 429, 5xx", () => {
  assert.equal(classifyWhatsAppError("timeout").retryable, true);
  assert.equal(classifyWhatsAppError("network_error").retryable, true);
  assert.equal(classifyWhatsAppError("429").retryable, true);
  assert.equal(classifyWhatsAppError("500").retryable, true);
  assert.equal(classifyWhatsAppError("503").retryable, true);
  assert.equal(classifyWhatsAppError("599").retryable, true);
});

test("errores no recuperables: config inválida, códigos de Meta, 4xx que no sean 429", () => {
  assert.equal(classifyWhatsAppError("config_invalid").retryable, false);
  assert.equal(classifyWhatsAppError("190").retryable, false); // token inválido (Meta)
  assert.equal(classifyWhatsAppError("100").retryable, false); // parámetro/plantilla inválida (Meta)
  assert.equal(classifyWhatsAppError("400").retryable, false);
  assert.equal(classifyWhatsAppError("401").retryable, false);
  assert.equal(classifyWhatsAppError("404").retryable, false);
});

test("sin errorCode (null/undefined) se clasifica como no recuperable por defecto", () => {
  assert.equal(classifyWhatsAppError(null).retryable, false);
  assert.equal(classifyWhatsAppError(undefined).retryable, false);
});
