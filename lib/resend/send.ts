import { resend } from "./client";
import {
  templateReservaConfirmacion,
  templateAdminNewReserva,
  type EmailReservaConfirmacionData,
  type EmailAdminNewReservaData,
} from "./template";

const ADMIN_EMAIL = "lautarobarba1@gmail.com"; // Cambiar por email real de la admin en producción

/**
 * Email al cliente cuando hace una reserva.
 * En sandbox Resend: solo llega a lautarobarba1@gmail.com
 */
export async function sendEmailReservaConfirmacion(
  data: EmailReservaConfirmacionData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const html = templateReservaConfirmacion(data);
    const result = await resend.emails.send({
      from: "aliciapalavecino02@gmail.com", // En sandbox, el 'from' se ignora (siempre viene de Resend)
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
 * Email a la admin cuando recibe una reserva nueva.
 * En sandbox Resend: solo llega a lautarobarba1@gmail.com
 */
export async function sendEmailAdminNewReserva(
  data: EmailAdminNewReservaData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const html = templateAdminNewReserva(data);
    const result = await resend.emails.send({
      from: "aliciapalavecino02@gmail.com",
      to: ADMIN_EMAIL,
      subject: `📬 Nueva reserva: ${data.customerName}`,
      html,
    });

    if (result.error) {
      console.error("[sendEmailAdminNewReserva]", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("[sendEmailAdminNewReserva exception]", err);
    return { success: false, error: String(err) };
  }
}

/**
 * Variante: email al cliente cuando admin marca pagada.
 * (Lo agregamos ahora pero no lo conectamos hasta que termines estos 2.)
 */
export async function sendEmailReservaConfirmada(
  customerEmail: string,
  customerName: string,
  className: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="font-family: sans-serif; margin: 0; padding: 20px; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 24px; border-radius: 8px;">
          <h1 style="color: #1f2937; margin-top: 0;">✓ Pago recibido</h1>
          <p style="color: #4b5563; line-height: 1.6;">
            Hola <strong>${customerName}</strong>,<br>
            Confirmamos que recibimos tu pago para <strong>${className}</strong>.<br>
            ¡Te esperamos pronto!
          </p>
        </div>
      </body>
      </html>
    `;

    const result = await resend.emails.send({
      from: "aliciapalavecino02@gmail.com",
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
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="font-family: sans-serif; margin: 0; padding: 20px; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 24px; border-radius: 8px;">
          <h1 style="color: #dc2626; margin-top: 0;">Reserva cancelada</h1>
          <p style="color: #4b5563; line-height: 1.6;">
            Hola <strong>${customerName}</strong>,<br>
            Lamentablemente cancelamos tu reserva para <strong>${className}</strong>.<br>
            Si tenés preguntas, contactanos.
          </p>
        </div>
      </body>
      </html>
    `;

    const result = await resend.emails.send({
      from: "aliciapalavecino02@gmail.com",
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