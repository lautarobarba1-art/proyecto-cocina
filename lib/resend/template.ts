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
              Si tenés preguntas, podés respondernos directamente a este email.
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
  
  export interface EmailPagoConfirmadoData {
    customerName: string;
    customerEmail: string;
    className: string;
    classDate: string; // "Sábado 17 de mayo de 2026"
    classTime: string; // "18:00 - 21:00"
    cupos: number;
  }

  export function templateReservaConfirmada(data: EmailPagoConfirmadoData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pago confirmado</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="margin: 0; font-size: 24px; color: #1f2937;">✓ Pago recibido</h1>
          </div>

          <div style="background-color: white; padding: 24px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <p style="margin: 0 0 16px 0; font-size: 16px; color: #4b5563;">
              Hola <strong>${esc(data.customerName)}</strong>,
            </p>

            <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
              Confirmamos que recibimos tu pago para <strong>${esc(data.className)}</strong>.
              Tu lugar está reservado y confirmado. ¡Te esperamos!
            </p>

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

            <p style="margin: 24px 0 0 0; font-size: 13px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 16px;">
              Si tenés preguntas, podés respondernos directamente a este email.
            </p>
          </div>

          <p style="text-align: center; margin-top: 24px; font-size: 12px; color: #9ca3af;">
            Menesteres &copy; 2026
          </p>
        </div>
      </body>
      </html>
    `;
  }

  export interface EmailRecordatorioData {
    customerName: string;
    customerEmail: string;
    className: string;
    classDate: string; // "Sábado 17 de mayo de 2026"
    classTime: string; // "18:00 - 21:00"
    cupos: number;
  }

  export function templateRecordatorio(data: EmailRecordatorioData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recordatorio de tu clase</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="margin: 0; font-size: 24px; color: #1f2937;">⏰ ¡Tu clase es mañana!</h1>
          </div>

          <div style="background-color: white; padding: 24px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <p style="margin: 0 0 16px 0; font-size: 16px; color: #4b5563;">
              Hola <strong>${esc(data.customerName)}</strong>,
            </p>

            <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
              Te recordamos que tenés una clase de <strong>${esc(data.className)}</strong> mañana. ¡Te esperamos!
            </p>

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

            <p style="margin: 24px 0 0 0; font-size: 13px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 16px;">
              Si tenés preguntas, podés respondernos directamente a este email.
            </p>
          </div>

          <p style="text-align: center; margin-top: 24px; font-size: 12px; color: #9ca3af;">
            Menesteres &copy; 2026
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

  export interface EmailReprogramacionData {
    customerName: string;
    customerEmail: string;
    className: string;
    oldDate: string; // "Sábado 17 de mayo de 2026"
    oldTime: string; // "18:00 - 21:00"
    newDate: string;
    newTime: string;
  }

  export function templateReprogramacion(data: EmailReprogramacionData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tu clase cambió de fecha</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="margin: 0; font-size: 24px; color: #1f2937;">📅 Tu clase cambió de fecha</h1>
          </div>

          <div style="background-color: white; padding: 24px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <p style="margin: 0 0 16px 0; font-size: 16px; color: #4b5563;">
              Hola <strong>${esc(data.customerName)}</strong>,
            </p>

            <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
              Te avisamos que tu clase de <strong>${esc(data.className)}</strong> se reprogramó. Estos son los nuevos datos:
            </p>

            <div style="background-color: #fff8f3; padding: 16px; border-radius: 4px; margin-bottom: 16px; border-left: 4px solid #9ca3af;">
              <div style="font-size: 13px; color: #6b7280; text-decoration: line-through;">
                Antes: ${esc(data.oldDate)} · ${esc(data.oldTime)}
              </div>
            </div>

            <div style="background-color: #f0fdf4; padding: 16px; border-radius: 4px; margin-bottom: 24px; border-left: 4px solid #16a34a;">
              <div style="margin-bottom: 8px;">
                <span style="font-weight: bold; color: #1f2937;">Nueva fecha:</span>
                <span style="color: #4b5563;">${esc(data.newDate)}</span>
              </div>
              <div>
                <span style="font-weight: bold; color: #1f2937;">Nuevo horario:</span>
                <span style="color: #4b5563;">${esc(data.newTime)}</span>
              </div>
            </div>

            <p style="margin: 24px 0 0 0; font-size: 13px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 16px;">
              Si el nuevo horario no te funciona, respondé este email y lo vemos juntos.
            </p>
          </div>

          <p style="text-align: center; margin-top: 24px; font-size: 12px; color: #9ca3af;">
            Menesteres &copy; 2026
          </p>
        </div>
      </body>
      </html>
    `;
  }

