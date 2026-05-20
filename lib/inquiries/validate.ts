import type { InquiryType } from "./types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type InquiryValidationError =
  | "invalid_json"
  | "invalid_body"
  | "invalid_type"
  | "missing_fields"
  | "invalid_email"
  | "fields_too_long"
  | "invalid_mensaje"
  | "invalid_fecha";

export interface ValidatedInquiry {
  type: InquiryType;
  name: string;
  email: string;
  payload: Record<string, string>;
}

export function validateInquiryBody(
  body: unknown,
): { ok: true; data: ValidatedInquiry } | { ok: false; error: InquiryValidationError } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "invalid_body" };
  }

  const b = body as Record<string, unknown>;

  if (typeof b.honeypot === "string" && b.honeypot.trim() !== "") {
    return { ok: true, data: { type: "contact", name: "", email: "", payload: {} } };
  }

  const type = b.type === "contact" || b.type === "espacio" ? b.type : null;
  if (!type) return { ok: false, error: "invalid_type" };

  const name = typeof b.name === "string" ? b.name.trim() : "";
  const email = typeof b.email === "string" ? b.email.trim() : "";

  if (!name || !email) return { ok: false, error: "missing_fields" };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "invalid_email" };
  if (name.length > 200 || email.length > 320) {
    return { ok: false, error: "fields_too_long" };
  }

  if (type === "contact") {
    const mensaje = typeof b.mensaje === "string" ? b.mensaje.trim() : "";
    if (!mensaje || mensaje.length < 8) return { ok: false, error: "invalid_mensaje" };
    if (mensaje.length > 5000) return { ok: false, error: "fields_too_long" };
    return {
      ok: true,
      data: { type, name, email, payload: { mensaje } },
    };
  }

  const marca = typeof b.marca === "string" ? b.marca.trim() : "";
  const fecha = typeof b.fecha === "string" ? b.fecha.trim() : "";
  const mensaje = typeof b.mensaje === "string" ? b.mensaje.trim() : "";

  if (!marca || !fecha || !mensaje) return { ok: false, error: "missing_fields" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return { ok: false, error: "invalid_fecha" };
  if (mensaje.length < 8) return { ok: false, error: "invalid_mensaje" };
  if (marca.length > 200 || mensaje.length > 5000) {
    return { ok: false, error: "fields_too_long" };
  }

  return {
    ok: true,
    data: {
      type,
      name,
      email,
      payload: { marca, fecha, mensaje },
    },
  };
}

/** Honeypot-only submission (bots) */
export function isHoneypotSubmission(data: ValidatedInquiry): boolean {
  return !data.name && !data.email;
}
