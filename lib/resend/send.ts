import { resend, FROM_EMAIL } from "./client";
import {
  templateReservaConfirmacion,
  templateReservaConfirmada,
  templateReservaCancelada,
  type EmailReservaConfirmacionData,
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
  customerEmail: string,
  customerName: string,
  className: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const html = templateReservaConfirmada(customerName, className);
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: customerEmail,
      subject: `✓ Pago confirmado: ${className}`,
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