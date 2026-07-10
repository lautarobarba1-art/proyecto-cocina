import type { NotificationEventType } from "../notifications/types.ts";

const DEFAULT_API_VERSION = "v21.0";
const DEFAULT_TEMPLATE_LANGUAGE = "es_AR";

export interface WhatsAppTemplateConfig {
  eventType: NotificationEventType;
  /** Nombre de la plantilla aprobada en Meta. null si no está configurada todavía. */
  name: string | null;
  language: string;
}

export interface WhatsAppConfig {
  /** Feature flag general. Si es false, el cliente no hace ninguna llamada real. */
  enabled: boolean;
  /** Si es true (default), el cliente simula el envío y nunca llama a la Graph API. */
  dryRun: boolean;
  apiVersion: string;
  accessToken: string | null;
  phoneNumberId: string | null;
  businessAccountId: string | null;
  appSecret: string | null;
  templates: Record<NotificationEventType, WhatsAppTemplateConfig>;
}

function parseBooleanFlag(value: string | undefined, defaultValue: boolean): boolean {
  if (value == null || value.trim() === "") return defaultValue;
  return value.trim().toLowerCase() === "true";
}

function nullIfEmpty(value: string | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

const TEMPLATE_ENV_VAR_BY_EVENT: Record<NotificationEventType, string> = {
  reserva_confirmada: "WHATSAPP_TEMPLATE_RESERVA_CONFIRMADA",
  pago_confirmado: "WHATSAPP_TEMPLATE_PAGO_CONFIRMADO",
  recordatorio: "WHATSAPP_TEMPLATE_RECORDATORIO",
  cancelacion: "WHATSAPP_TEMPLATE_CANCELACION",
  reprogramacion: "WHATSAPP_TEMPLATE_REPROGRAMACION",
};

/**
 * Lee y normaliza la configuración de WhatsApp desde variables de entorno.
 * Nunca lanza: si faltan credenciales pero `enabled`/`dryRun` no las
 * necesitan (feature apagada o en modo simulado), la app debe poder
 * arrancar igual. La validación "dura" de credenciales vive en
 * `validateWhatsAppConfig`, que se llama recién antes de un envío real.
 */
export function loadWhatsAppConfig(
  env: Record<string, string | undefined> = process.env,
): WhatsAppConfig {
  const language = nullIfEmpty(env.WHATSAPP_TEMPLATE_LANGUAGE) ?? DEFAULT_TEMPLATE_LANGUAGE;

  const templates = Object.fromEntries(
    (Object.keys(TEMPLATE_ENV_VAR_BY_EVENT) as NotificationEventType[]).map((eventType) => {
      const config: WhatsAppTemplateConfig = {
        eventType,
        name: nullIfEmpty(env[TEMPLATE_ENV_VAR_BY_EVENT[eventType]]),
        language,
      };
      return [eventType, config];
    }),
  ) as Record<NotificationEventType, WhatsAppTemplateConfig>;

  return {
    enabled: parseBooleanFlag(env.WHATSAPP_ENABLED, false),
    dryRun: parseBooleanFlag(env.WHATSAPP_DRY_RUN, true),
    apiVersion: nullIfEmpty(env.WHATSAPP_API_VERSION) ?? DEFAULT_API_VERSION,
    accessToken: nullIfEmpty(env.WHATSAPP_ACCESS_TOKEN),
    phoneNumberId: nullIfEmpty(env.WHATSAPP_PHONE_NUMBER_ID),
    businessAccountId: nullIfEmpty(env.WHATSAPP_BUSINESS_ACCOUNT_ID),
    appSecret: nullIfEmpty(env.WHATSAPP_APP_SECRET),
    templates,
  };
}

export interface WhatsAppConfigValidation {
  ok: boolean;
  errors: string[];
}

/**
 * Valida que haya credenciales suficientes para un envío REAL (no dry-run).
 * Se llama desde el cliente justo antes de pegarle a la Graph API, no al
 * cargar el módulo — así la app no se cae por no tener WhatsApp configurado
 * mientras esté deshabilitado o en modo simulado.
 *
 * WHATSAPP_APP_SECRET NO se valida acá a propósito: no hace falta para
 * mandar un mensaje, solo para validar la firma HMAC de los webhooks
 * entrantes (Etapa 6, todavía no construida). Antes se exigía acá por
 * error, lo que bloqueaba cualquier envío real mientras esa variable
 * quedara vacía — sin relación real con la capacidad de enviar.
 */
export function validateWhatsAppConfig(config: WhatsAppConfig): WhatsAppConfigValidation {
  const errors: string[] = [];

  if (!config.accessToken) errors.push("Falta WHATSAPP_ACCESS_TOKEN");
  if (!config.phoneNumberId) errors.push("Falta WHATSAPP_PHONE_NUMBER_ID");

  return { ok: errors.length === 0, errors };
}

export function getTemplateConfig(
  config: WhatsAppConfig,
  eventType: NotificationEventType,
): WhatsAppTemplateConfig {
  return config.templates[eventType];
}
