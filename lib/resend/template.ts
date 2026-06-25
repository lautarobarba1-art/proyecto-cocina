/**
 * Templates HTML de emails. Simples pero funcionales.
 */

function esc(text: string | null | undefined): string {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface EmailReservaConfirmacionData {
    customerName: string;
    customerEmail: string;
    className: string;
    classDate: string; // "Sábado 17 de mayo de 2026"
    classTime: string; // "18:00 - 21:00"
    depositAmount?: number | null;
    cupos: number;
    transferHolder?: string | null;
    transferAlias?: string | null;
    transferCvu?: string | null;
    transferBank?: string | null;
  }

  export function templateReservaConfirmacion(
    data: EmailReservaConfirmacionData,
  ): string {
    const depositLabel = data.depositAmount != null && data.depositAmount > 0
      ? new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(data.depositAmount)
      : null;

    const paymentSection = depositLabel
      ? `
      <div style="margin-top: 24px; padding: 16px; background-color: #fff8f3; border-left: 4px solid #d97706;">
        <p style="margin: 0; font-weight: bold; color: #1f2937;">Datos para transferir la seña · ${depositLabel}</p>
        <p style="margin: 8px 0 12px 0; font-size: 14px; color: #4b5563;">
          Para confirmar tu lugar, realizá la transferencia a los siguientes datos:
        </p>
        <table style="font-size: 14px; color: #374151; border-collapse: collapse; width: 100%;">
          <tr><td style="padding: 4px 12px 4px 0; font-weight: bold; white-space: nowrap;">Monto:</td><td style="padding: 4px 0;">${esc(depositLabel)}</td></tr>
          ${data.transferHolder ? `<tr><td style="padding: 4px 12px 4px 0; font-weight: bold; white-space: nowrap;">Titular:</td><td style="padding: 4px 0;">${esc(data.transferHolder)}</td></tr>` : ""}
          ${data.transferAlias ? `<tr><td style="padding: 4px 12px 4px 0; font-weight: bold; white-space: nowrap;">Alias:</td><td style="padding: 4px 0;">${esc(data.transferAlias)}</td></tr>` : ""}
          ${data.transferCvu ? `<tr><td style="padding: 4px 12px 4px 0; font-weight: bold; white-space: nowrap;">CVU:</td><td style="padding: 4px 0;">${esc(data.transferCvu)}</td></tr>` : ""}
          ${data.transferBank ? `<tr><td style="padding: 4px 12px 4px 0; font-weight: bold; white-space: nowrap;">Banco / Billetera:</td><td style="padding: 4px 0;">${esc(data.transferBank)}</td></tr>` : ""}
        </table>
        <p style="margin: 12px 0 0 0; font-size: 13px; color: #6b7280; font-style: italic;">
          La reserva queda pendiente hasta que el pago sea realizado.
        </p>
      </div>
      `
      : `
      <div style="margin-top: 24px; padding: 16px; background-color: #f0fdf4; border-left: 4px solid #16a34a;">
        <p style="margin: 0; font-weight: bold; color: #1f2937;">Gratuita</p>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #4b5563;">
          No hay costo para esta clase.
        </p>
      </div>
      `;
  
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reserva confirmada</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="margin: 0; font-size: 24px; color: #1f2937;">
              ¡Reserva confirmada!
            </h1>
          </div>
  
          <!-- Body -->
          <div style="background-color: white; padding: 24px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <p style="margin: 0 0 16px 0; font-size: 16px; color: #4b5563;">
              Hola <strong>${esc(data.customerName)}</strong>,
            </p>

            <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
              Recibimos tu reserva para la clase de <strong>${esc(data.className)}</strong>.
              Aquí están los detalles:
            </p>

            <!-- Detalles -->
            <div style="background-color: #f3f4f6; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
              <div style="margin-bottom: 12px;">
                <span style="font-weight: bold; color: #1f2937;">Clase:</span>
                <span style="color: #4b5563;">${esc(data.className)}</span>
              </div>
              <div style="margin-bottom: 12px;">
                <span style="font-weight: bold; color: #1f2937;">Fecha:</span>
                <span style="color: #4b5563;">${esc(data.classDate)}</span>
              </div>
              <div style="margin-bottom: 12px;">
                <span style="font-weight: bold; color: #1f2937;">Horario:</span>
                <span style="color: #4b5563;">${esc(data.classTime)}</span>
              </div>
              <div>
                <span style="font-weight: bold; color: #1f2937;">Cupos:</span>
                <span style="color: #4b5563;">${esc(String(data.cupos))}</span>
              </div>
            </div>
  
            <!-- Payment section -->
            ${paymentSection}
  
            <!-- Footer -->
            <p style="margin: 24px 0 0 0; font-size: 13px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 16px;">
              Si tenés preguntas, podés respondernos a este email o contactarnos por WhatsApp.
            </p>
          </div>
  
          <!-- Copyright -->
          <p style="text-align: center; margin-top: 24px; font-size: 12px; color: #9ca3af;">
            Menesteres &copy; 2026
          </p>
        </div>
      </body>
      </html>
    `;
  }
  
  export function templateReservaConfirmada(
    customerName: string,
    className: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 24px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <h1 style="color: #1f2937; margin-top: 0;">✓ Pago recibido</h1>
          <p style="color: #4b5563; line-height: 1.6;">
            Hola <strong>${esc(customerName)}</strong>,<br>
            Confirmamos que recibimos tu pago para <strong>${esc(className)}</strong>.<br>
            ¡Te esperamos pronto!
          </p>
        </div>
      </body>
      </html>
    `;
  }

  export function templateReservaCancelada(
    customerName: string,
    className: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 24px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <h1 style="color: #dc2626; margin-top: 0;">Reserva cancelada</h1>
          <p style="color: #4b5563; line-height: 1.6;">
            Hola <strong>${esc(customerName)}</strong>,<br>
            Lamentablemente cancelamos tu reserva para <strong>${esc(className)}</strong>.<br>
            Si tenés preguntas, contactanos.
          </p>
        </div>
      </body>
      </html>
    `;
  }

