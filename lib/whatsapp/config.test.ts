import { test } from "node:test";
import assert from "node:assert/strict";

import { loadWhatsAppConfig, validateWhatsAppConfig, getTemplateConfig } from "./config.ts";

test("loadWhatsAppConfig por defecto queda deshabilitado y en dry-run (sin env vars)", () => {
  const config = loadWhatsAppConfig({});
  assert.equal(config.enabled, false);
  assert.equal(config.dryRun, true);
  assert.equal(config.apiVersion, "v21.0");
  assert.equal(config.accessToken, null);
  assert.equal(config.phoneNumberId, null);
});

test("loadWhatsAppConfig respeta WHATSAPP_ENABLED=true y WHATSAPP_DRY_RUN=false explícitos", () => {
  const config = loadWhatsAppConfig({
    WHATSAPP_ENABLED: "true",
    WHATSAPP_DRY_RUN: "false",
  });
  assert.equal(config.enabled, true);
  assert.equal(config.dryRun, false);
});

test("loadWhatsAppConfig trata cualquier valor que no sea exactamente 'true' como false", () => {
  const config = loadWhatsAppConfig({
    WHATSAPP_ENABLED: "yes",
    WHATSAPP_DRY_RUN: "1",
  });
  assert.equal(config.enabled, false);
  assert.equal(config.dryRun, false);
});

test("loadWhatsAppConfig lee credenciales y permite override de api version", () => {
  const config = loadWhatsAppConfig({
    WHATSAPP_ACCESS_TOKEN: "token-123",
    WHATSAPP_PHONE_NUMBER_ID: "phone-id-1",
    WHATSAPP_BUSINESS_ACCOUNT_ID: "waba-1",
    WHATSAPP_APP_SECRET: "secret-1",
    WHATSAPP_API_VERSION: "v20.0",
  });
  assert.equal(config.accessToken, "token-123");
  assert.equal(config.phoneNumberId, "phone-id-1");
  assert.equal(config.businessAccountId, "waba-1");
  assert.equal(config.appSecret, "secret-1");
  assert.equal(config.apiVersion, "v20.0");
});

test("loadWhatsAppConfig arma nombres de plantillas configurables por evento, sin hardcodear", () => {
  const config = loadWhatsAppConfig({
    WHATSAPP_TEMPLATE_RESERVA_CONFIRMADA: "reserva_confirmada_v1",
    WHATSAPP_TEMPLATE_PAGO_CONFIRMADO: "pago_confirmado_v1",
    WHATSAPP_TEMPLATE_LANGUAGE: "es",
  });

  assert.equal(getTemplateConfig(config, "reserva_confirmada").name, "reserva_confirmada_v1");
  assert.equal(getTemplateConfig(config, "reserva_confirmada").language, "es");
  assert.equal(getTemplateConfig(config, "pago_confirmado").name, "pago_confirmado_v1");
  // Plantillas no configuradas quedan en null, no undefined ni un string vacío.
  assert.equal(getTemplateConfig(config, "recordatorio").name, null);
});

test("loadWhatsAppConfig usa 'es_AR' como idioma de plantilla por defecto", () => {
  const config = loadWhatsAppConfig({});
  assert.equal(getTemplateConfig(config, "cancelacion").language, "es_AR");
});

test("validateWhatsAppConfig falla si faltan credenciales", () => {
  const config = loadWhatsAppConfig({});
  const result = validateWhatsAppConfig(config);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("WHATSAPP_ACCESS_TOKEN")));
  assert.ok(result.errors.some((e) => e.includes("WHATSAPP_PHONE_NUMBER_ID")));
  assert.ok(result.errors.some((e) => e.includes("WHATSAPP_APP_SECRET")));
});

test("validateWhatsAppConfig pasa si están las tres credenciales requeridas", () => {
  const config = loadWhatsAppConfig({
    WHATSAPP_ACCESS_TOKEN: "token-123",
    WHATSAPP_PHONE_NUMBER_ID: "phone-id-1",
    WHATSAPP_APP_SECRET: "secret-1",
  });
  const result = validateWhatsAppConfig(config);
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
});
