import { resend, FROM_EMAIL } from "./client";
import {
  templateReservaConfirmacion,
  templateReservaConfirmada,
  templateReservaCancelada,
  templateRecordatorio,
  templateReprogramacion,
  type EmailReservaConfirmacionData,
  type EmailPagoConfirmadoData,
  type EmailRecordatorioData,
  type EmailReprogramacionData,
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
      subject: `✓ Reserva confirmada: ${data.className}`,
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