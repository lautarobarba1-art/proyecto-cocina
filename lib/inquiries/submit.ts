export type SubmitInquiryResult =
  | { ok: true }
  | { ok: false; error: string; userMessage: string };

const ERROR_MESSAGES: Record<string, string> = {
  invalid_email: "Revisá el correo electrónico.",
  invalid_mensaje: "El mensaje debe tener al menos 8 caracteres.",
  invalid_fecha: "Elegí una fecha válida.",
  missing_fields: "Completá todos los campos obligatorios.",
  fields_too_long: "Algún campo es demasiado largo.",
  server_error: "No pudimos enviar tu mensaje. Intentá de nuevo en unos minutos.",
};

export async function submitInquiry(
  body: Record<string, unknown>,
): Promise<SubmitInquiryResult> {
  const res = await fetch("/api/inquiries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.ok) return { ok: true };

  let code = "server_error";
  try {
    const data = (await res.json()) as { error?: string };
    if (typeof data.error === "string") code = data.error;
  } catch {
    /* ignore */
  }

  return {
    ok: false,
    error: code,
    userMessage: ERROR_MESSAGES[code] ?? ERROR_MESSAGES.server_error,
  };
}
