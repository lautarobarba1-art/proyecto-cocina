import { test } from "node:test";
import assert from "node:assert/strict";

import { sendWhatsAppTemplateMessage } from "./client.ts";
import type { WhatsAppConfig } from "./config.ts";

function baseConfig(overrides: Partial<WhatsAppConfig> = {}): WhatsAppConfig {
  return {
    enabled: false,
    dryRun: true,
    apiVersion: "v21.0",
    accessToken: null,
    phoneNumberId: null,
    businessAccountId: null,
    appSecret: null,
    templates: {
      reserva_confirmada: { eventType: "reserva_confirmada", name: null, language: "es_AR" },
      pago_confirmado: { eventType: "pago_confirmado", name: null, language: "es_AR" },
      recordatorio: { eventType: "recordatorio", name: null, language: "es_AR" },
      cancelacion: { eventType: "cancelacion", name: null, language: "es_AR" },
      reprogramacion: { eventType: "reprogramacion", name: null, language: "es_AR" },
    },
    ...overrides,
  };
}

function failIfCalled(): typeof fetch {
  return (() => {
    throw new Error("fetch no debería haberse llamado en este modo");
  }) as unknown as typeof fetch;
}

const sampleParams = {
  to: "5491123456789",
  templateName: "reserva_confirmada_v1",
  languageCode: "es_AR",
};

test("con WHATSAPP_ENABLED=false nunca llama a fetch y devuelve outcome 'disabled'", async () => {
  const result = await sendWhatsAppTemplateMessage(sampleParams, {
    config: baseConfig({ enabled: false, dryRun: false }),
    fetchImpl: failIfCalled(),
  });
  assert.equal(result.outcome, "disabled");
  assert.equal(result.success, false);
});

test("con WHATSAPP_DRY_RUN=true (aunque enabled=true) nunca llama a fetch y simula éxito", async () => {
  const result = await sendWhatsAppTemplateMessage(sampleParams, {
    config: baseConfig({ enabled: true, dryRun: true }),
    fetchImpl: failIfCalled(),
  });
  assert.equal(result.outcome, "dry_run");
  assert.equal(result.success, true);
  assert.ok(result.providerMessageId?.startsWith("dry-run-"));
});

test("enabled=true + dryRun=false sin credenciales devuelve error 'config_invalid' sin llamar a fetch", async () => {
  const result = await sendWhatsAppTemplateMessage(sampleParams, {
    config: baseConfig({ enabled: true, dryRun: false }),
    fetchImpl: failIfCalled(),
  });
  assert.equal(result.outcome, "error");
  assert.equal(result.success, false);
  assert.equal(result.errorCode, "config_invalid");
  assert.match(result.errorMessage ?? "", /WHATSAPP_ACCESS_TOKEN/);
});

test("enabled=true + dryRun=false con credenciales hace un POST real a la Graph API y devuelve 'sent'", async () => {
  let capturedUrl = "";
  let capturedBody: unknown = null;
  let capturedAuth = "";

  const fetchImpl = (async (url: string, init?: RequestInit) => {
    capturedUrl = url;
    capturedBody = JSON.parse(String(init?.body));
    capturedAuth = (init?.headers as Record<string, string>).Authorization;
    return {
      ok: true,
      status: 200,
      json: async () => ({ messages: [{ id: "wamid.ABC123" }] }),
    };
  }) as unknown as typeof fetch;

  const result = await sendWhatsAppTemplateMessage(sampleParams, {
    config: baseConfig({
      enabled: true,
      dryRun: false,
      accessToken: "token-123",
      phoneNumberId: "phone-id-1",
      appSecret: "secret-1",
      apiVersion: "v20.0",
    }),
    fetchImpl,
  });

  assert.equal(result.outcome, "sent");
  assert.equal(result.success, true);
  assert.equal(result.providerMessageId, "wamid.ABC123");
  assert.equal(capturedUrl, "https://graph.facebook.com/v20.0/phone-id-1/messages");
  assert.equal(capturedAuth, "Bearer token-123");
  assert.deepEqual(capturedBody, {
    messaging_product: "whatsapp",
    to: "5491123456789",
    type: "template",
    template: {
      name: "reserva_confirmada_v1",
      language: { code: "es_AR" },
      components: [],
    },
  });
});

test("respuesta no-ok de la Graph API se traduce en outcome 'error' con código y mensaje de Meta", async () => {
  const fetchImpl = (async () => ({
    ok: false,
    status: 401,
    json: async () => ({ error: { code: 190, message: "Invalid OAuth access token" } }),
  })) as unknown as typeof fetch;

  const result = await sendWhatsAppTemplateMessage(sampleParams, {
    config: baseConfig({
      enabled: true,
      dryRun: false,
      accessToken: "token-invalido",
      phoneNumberId: "phone-id-1",
      appSecret: "secret-1",
    }),
    fetchImpl,
  });

  assert.equal(result.outcome, "error");
  assert.equal(result.success, false);
  assert.equal(result.errorCode, "190");
  assert.equal(result.errorMessage, "Invalid OAuth access token");
});

test("una excepción de red se traduce en outcome 'error' con errorCode 'network_error'", async () => {
  const fetchImpl = (async () => {
    throw new Error("ECONNRESET");
  }) as unknown as typeof fetch;

  const result = await sendWhatsAppTemplateMessage(sampleParams, {
    config: baseConfig({
      enabled: true,
      dryRun: false,
      accessToken: "token-123",
      phoneNumberId: "phone-id-1",
      appSecret: "secret-1",
    }),
    fetchImpl,
  });

  assert.equal(result.outcome, "error");
  assert.equal(result.errorCode, "network_error");
  assert.match(result.errorMessage ?? "", /ECONNRESET/);
});
