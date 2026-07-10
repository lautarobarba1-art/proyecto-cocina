import { loadWhatsAppConfig, validateWhatsAppConfig, type WhatsAppConfig } from "./config.ts";

/**
 * Nota para cuando esto se conecte a `notification_log` (Etapa 2+):
 *
 * - El `deliveryMode` con el que se llama a `claimNotification` se decide
 *   ANTES de invocar este cliente, a partir de la config (`config.enabled &&
 *   !config.dryRun ? "live" : "dry_run"`) — nunca a partir del outcome, que
 *   se conoce recién después. Así un intento "dry_run"/"disabled" nunca
 *   ocupa la deduplication_key de 'live' (ver migración
 *   20260709000001_notification_log.sql).
 * - outcome "disabled" u "dry_run" -> `completeNotification` con
 *   status='skipped' (nunca 'sent'), con el outcome como `errorCode`.
 * - outcome "sent" -> status='sent'.
 * - outcome "error" -> status='failed', clasificando `retryable` según el
 *   tipo de error (ver validateWhatsAppConfig/errorCode: p.ej. credenciales
 *   inválidas o plantilla rechazada son permanentes; timeouts/5xx son
 *   recuperables).
 */
export type SendOutcome = "disabled" | "dry_run" | "sent" | "error";

export interface WhatsAppTemplateComponent {
  type: "header" | "body" | "button";
  parameters: Array<{ type: "text"; text: string }>;
}

export interface SendTemplateMessageParams {
  /** E.164 sin el "+", p. ej. "5491123456789" (ver lib/whatsapp/phone.ts). */
  to: string;
  templateName: string;
  languageCode: string;
  components?: WhatsAppTemplateComponent[];
}

export interface SendTemplateMessageResult {
  outcome: SendOutcome;
  success: boolean;
  providerMessageId?: string;
  errorCode?: string;
  errorMessage?: string;
}

type FetchLike = typeof fetch;

interface WhatsAppSendApiResponse {
  messages?: Array<{ id: string }>;
  error?: { code?: number; message?: string };
}

/**
 * Envía un mensaje de plantilla por WhatsApp Cloud API.
 *
 * Modo seguro por defecto: si `config.enabled` es false o `config.dryRun` es
 * true (el default de `loadWhatsAppConfig`), esta función NUNCA hace un
 * fetch real — solo loguea qué habría enviado. Recién hace la llamada HTTP
 * real cuando enabled=true Y dryRun=false, y solo si hay credenciales
 * completas (ver `validateWhatsAppConfig`).
 */
export async function sendWhatsAppTemplateMessage(
  params: SendTemplateMessageParams,
  options: { config?: WhatsAppConfig; fetchImpl?: FetchLike } = {},
): Promise<SendTemplateMessageResult> {
  const config = options.config ?? loadWhatsAppConfig();
  const fetchImpl = options.fetchImpl ?? fetch;

  if (!config.enabled) {
    return { outcome: "disabled", success: false };
  }

  if (config.dryRun) {
    console.log("[whatsapp:dry-run] simulando envío", {
      to: redactPhone(params.to),
      templateName: params.templateName,
      languageCode: params.languageCode,
    });
    return {
      outcome: "dry_run",
      success: true,
      providerMessageId: `dry-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    };
  }

  const validation = validateWhatsAppConfig(config);
  if (!validation.ok) {
    return {
      outcome: "error",
      success: false,
      errorCode: "config_invalid",
      errorMessage: validation.errors.join("; "),
    };
  }

  try {
    const response = await fetchImpl(
      `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: params.to,
          type: "template",
          template: {
            name: params.templateName,
            language: { code: params.languageCode },
            components: params.components ?? [],
          },
        }),
      },
    );

    const json = (await response.json().catch(() => null)) as WhatsAppSendApiResponse | null;

    if (!response.ok) {
      return {
        outcome: "error",
        success: false,
        errorCode: json?.error?.code != null ? String(json.error.code) : String(response.status),
        errorMessage: json?.error?.message ?? `HTTP ${response.status}`,
      };
    }

    return {
      outcome: "sent",
      success: true,
      providerMessageId: json?.messages?.[0]?.id,
    };
  } catch (err) {
    return {
      outcome: "error",
      success: false,
      errorCode: "network_error",
      errorMessage: err instanceof Error ? err.message : String(err),
    };
  }
}

function redactPhone(to: string): string {
  if (to.length <= 4) return "***";
  return `${to.slice(0, 4)}***${to.slice(-2)}`;
}
