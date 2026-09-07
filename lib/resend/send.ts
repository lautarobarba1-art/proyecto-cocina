import { resend, FROM_EMAIL } from "./client";
import {
  templateReservaConfirmacion,
  templateReservaConfirmada,
  templateReservaCancelada,
  templateReservaCanceladaPorFaltaComprobante,
  templateRecordatorio,
  templateRecordatorioComprobante,
  templateReprogramacion,
  templateAdminComprobanteSubido,
  templateAdminReservaNueva,
  templateAdminConsultaNueva,
  type EmailReservaConfirmacionData,
  type EmailPagoConfirmadoData,
  type EmailRecordatorioData,
  type EmailRecordatorioComprobanteData,
  type EmailReprogramacionData,
  type EmailAdminComprobanteSubidoData,
  type EmailAdminReservaNuevaData,
  type EmailAdminConsultaNuevaData,
} from "./template";

/**
 * Email al cliente cuando hace una reserva.
 */
export async function sendEmailReservaConfirmacion(
  data: EmailReservaConfirmacionData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const html = templateReservaConfirmacion(data);
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject: `Reserva recibida — falta confirmar el pago: ${data.className}`,
      html,
    });

    if (result.error) {
      console.error("[sendEmailReservaConfirmacion]", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("[sendEmailReservaConfirmacion exception]", err);
    return { success: false, error: String(err) };
  }
}

/**
 * Email al cliente cuando admin marca pagada.
 */
export async function sendEmailReservaConfirmada(
  data: EmailPagoConfirmadoData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const html = templateReservaConfirmada(data);
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject: `✓ Pago confirmado: ${data.className}`,
      html,
    });

    if (result.error) {
      console.error("[sendEmailReservaConfirmada]", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("[sendEmailReservaConfirmada exception]", err);
    return { success: false, error: String(err) };
  }
}

/**
 * Variante: email al cliente cuando se cancela reserva.
 */
export async function sendEmailReservaCancelada(
  customerEmail: string,
  customerName: string,
  className: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const html = templateReservaCancelada(customerName, className);
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: customerEmail,
      subject: `Reserva cancelada: ${className}`,
      html,
    });

    if (result.error) {
      console.error("[sendEmailReservaCancelada]", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("[sendEmailReservaCancelada exception]", err);
    return { success: false, error: String(err) };
  }
}

/**
 * Variante: email al cliente cuando se cancela la reserva por no haber
 * subido comprobante dentro del plazo (cron de expiración, no acción manual
 * del admin — ver lib/notifications/payment-deadline-dispatch.ts).
 */
export async function sendEmailReservaCanceladaPorFaltaComprobante(
  customerEmail: string,
  customerName: string,
  className: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const html = templateReservaCanceladaPorFaltaComprobante(customerName, className);
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: customerEmail,
      subject: `Reserva cancelada: ${className}`,
      html,
    });

    if (result.error) {
      console.error("[sendEmailReservaCanceladaPorFaltaComprobante]", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("[sendEmailReservaCanceladaPorFaltaComprobante exception]", err);
    return { success: false, error: String(err) };
  }
}

/**
 * Email de aviso al cliente ~24hs antes de que se cancele automáticamente
 * su reserva `pending` por no haber subido comprobante.
 */
export async function sendEmailRecordatorioComprobante(
  data: EmailRecordatorioComprobanteData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const html = templateRecordatorioComprobante(data);
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject: `⏳ Tu reserva de ${data.className} se cancela mañana`,
      html,
    });

    if (result.error) {
      console.error("[sendEmailRecordatorioComprobante]", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("[sendEmailRecordatorioComprobante exception]", err);
    return { success: false, error: String(err) };
  }
}

/**
 * Email de recordatorio ~24hs antes de la clase (solo reservas confirmed).
 */
export async function sendEmailRecordatorio(
  data: EmailRecordatorioData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const html = templateRecordatorio(data);
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject: `⏰ Recordatorio: ${data.className} es mañana`,
      html,
    });

    if (result.error) {
      console.error("[sendEmailRecordatorio]", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("[sendEmailRecordatorio exception]", err);
    return { success: false, error: String(err) };
  }
}

/**
 * Aviso a la admin cuando un cliente sube un comprobante de pago. Sin este
 * aviso la única forma de enterarse era entrando al panel a mirar.
 * Fail-open: si ADMIN_EMAIL no está configurado, no se envía nada (no bloquea
 * la subida del comprobante, que ya se guardó igual).
 */
export async function sendEmailAdminComprobanteSubido(
  data: EmailAdminComprobanteSubidoData,
): Promise<{ success: boolean; error?: string }> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn("[sendEmailAdminComprobanteSubido] Falta ADMIN_EMAIL — no se envía aviso");
    return { success: false, error: "admin_email_not_configured" };
  }
  try {
    const html = templateAdminComprobanteSubido(data);
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmail,
      subject: `📎 Comprobante subido: ${data.className}`,
      html,
    });

    if (result.error) {
      console.error("[sendEmailAdminComprobanteSubido]", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("[sendEmailAdminComprobanteSubido exception]", err);
    return { success: false, error: String(err) };
  }
}

/**
 * Aviso a la admin cuando un cliente crea una reserva nueva. Hasta ahora la
 * admin recién se enteraba de una reserva cuando alguien subía un
 * comprobante — si nunca lo subía, la reserva podía quedar invisible para
 * ella indefinidamente. Fail-open: sin ADMIN_EMAIL no se envía nada (no
 * bloquea la creación de la reserva, que ya se guardó igual).
 */
export async function sendEmailAdminReservaNueva(
  data: EmailAdminReservaNuevaData,
): Promise<{ success: boolean; error?: string }> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn("[sendEmailAdminReservaNueva] Falta ADMIN_EMAIL — no se envía aviso");
    return { success: false, error: "admin_email_not_configured" };
  }
  try {
    const html = templateAdminReservaNueva(data);
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmail,
      subject: `🆕 Nueva reserva pendiente de pago: ${data.className}`,
      html,
    });

    if (result.error) {
      console.error("[sendEmailAdminReservaNueva]", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("[sendEmailAdminReservaNueva exception]", err);
    return { success: false, error: String(err) };
  }
}

/**
 * Aviso a la admin cuando llega una consulta nueva (contacto, evento
 * privado o alquiler del espacio). Hasta ahora `POST /api/inquiries` no
 * disparaba ningún email — la única forma de enterarse era entrar al panel
 * a revisar. Fail-open: sin ADMIN_EMAIL no se envía nada.
 */
export async function sendEmailAdminConsultaNueva(
  data: EmailAdminConsultaNuevaData,
): Promise<{ success: boolean; error?: string }> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn("[sendEmailAdminConsultaNueva] Falta ADMIN_EMAIL — no se envía aviso");
    return { success: false, error: "admin_email_not_configured" };
  }
  try {
    const html = templateAdminConsultaNueva(data);
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmail,
      subject: `✉️ Nueva consulta: ${data.typeLabel}`,
      html,
    });

    if (result.error) {
      console.error("[sendEmailAdminConsultaNueva]", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("[sendEmailAdminConsultaNueva exception]", err);
    return { success: false, error: String(err) };
  }
}

/**
 * Email al cliente cuando se reprograma la clase de su reserva (pending o
 * confirmed) a otra fecha/horario.
 */
export async function sendEmailReprogramacion(
  data: EmailReprogramacionData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const html = templateReprogramacion(data);
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject: `📅 ${data.className} cambió de fecha`,
      html,
    });

    if (result.error) {
      console.error("[sendEmailReprogramacion]", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("[sendEmailReprogramacion exception]", err);
    return { success: false, error: String(err) };
  }
}