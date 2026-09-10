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
    /** Link persistente para subir el comprobante en cualquier momento, no solo en el momento de reservar. */
    uploadUrl: string;
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
        <p style="margin-top: 16px;">
          <a href="${esc(data.uploadUrl)}" style="display: inline-block; background-color: #d97706; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none; font-weight: bold; font-size: 14px;">
            Subir comprobante
          </a>
        </p>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #9ca3af;">
          Guardá este email: podés volver a este link para subir el comprobante en cualquier momento.
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
        <title>Reserva recibida — falta confirmar el pago</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="margin: 0; font-size: 24px; color: #1f2937;">
              Reserva recibida — falta confirmar el pago
            </h1>
          </div>

          <!-- Body -->
          <div style="background-color: white; padding: 24px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <p style="margin: 0 0 16px 0; font-size: 16px; color: #4b5563;">
              Hola <strong>${esc(data.customerName)}</strong>,
            </p>

            <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
              Recibimos tu reserva para la clase de <strong>${esc(data.className)}</strong>.
              Todavía no está confirmada: tu lugar queda asegurado recién cuando
              confirmemos el pago de la seña. Aquí están los detalles:
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

  export function templateReservaCanceladaPorFaltaComprobante(
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
            Cancelamos tu reserva para <strong>${esc(className)}</strong> porque no recibimos el comprobante de pago dentro del plazo.<br>
            Si ya transferiste y esto es un error, respondé este email con el comprobante y te reactivamos la reserva si todavía hay cupo.
          </p>
        </div>
      </body>
      </html>
    `;
  }

  export interface EmailRecordatorioComprobanteData {
    customerName: string;
    customerEmail: string;
    className: string;
    depositAmount?: number | null;
    transferHolder?: string | null;
    transferAlias?: string | null;
    transferCvu?: string | null;
    transferBank?: string | null;
    uploadUrl: string;
  }

  export function templateRecordatorioComprobante(
    data: EmailRecordatorioComprobanteData,
  ): string {
    const depositLabel = data.depositAmount != null && data.depositAmount > 0
      ? new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(data.depositAmount)
      : null;

    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="margin: 0; font-size: 24px; color: #1f2937;">⏳ Tu reserva se cancela mañana</h1>
          </div>
          <div style="background-color: white; padding: 24px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <p style="margin: 0 0 16px 0; font-size: 16px; color: #4b5563;">
              Hola <strong>${esc(data.customerName)}</strong>,
            </p>
            <p style="margin: 0 0 20px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
              Todavía no recibimos el comprobante de pago de tu reserva para
              <strong>${esc(data.className)}</strong>${depositLabel ? ` (${esc(depositLabel)})` : ""}.
              Si no lo subís antes de mañana, la reserva se cancela automáticamente para liberar el cupo.
            </p>
            ${data.transferHolder || data.transferAlias || data.transferCvu || data.transferBank
              ? `
              <table style="font-size: 14px; color: #374151; border-collapse: collapse; width: 100%; margin-bottom: 20px;">
                ${data.transferHolder ? `<tr><td style="padding: 4px 12px 4px 0; font-weight: bold; white-space: nowrap;">Titular:</td><td style="padding: 4px 0;">${esc(data.transferHolder)}</td></tr>` : ""}
                ${data.transferAlias ? `<tr><td style="padding: 4px 12px 4px 0; font-weight: bold; white-space: nowrap;">Alias:</td><td style="padding: 4px 0;">${esc(data.transferAlias)}</td></tr>` : ""}
                ${data.transferCvu ? `<tr><td style="padding: 4px 12px 4px 0; font-weight: bold; white-space: nowrap;">CVU:</td><td style="padding: 4px 0;">${esc(data.transferCvu)}</td></tr>` : ""}
                ${data.transferBank ? `<tr><td style="padding: 4px 12px 4px 0; font-weight: bold; white-space: nowrap;">Banco / Billetera:</td><td style="padding: 4px 0;">${esc(data.transferBank)}</td></tr>` : ""}
              </table>
              `
              : ""}
            <p>
              <a href="${esc(data.uploadUrl)}" style="display: inline-block; background-color: #d97706; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none; font-weight: bold; font-size: 14px;">
                Subir comprobante
              </a>
            </p>
            <p style="margin: 24px 0 0 0; font-size: 13px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 16px;">
              Si ya transferiste y todavía no subiste el comprobante, hacelo desde el botón de arriba.
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

  export interface EmailAdminComprobanteSubidoData {
    customerName: string;
    customerEmail: string;
    className: string;
    cupos: number;
    reviewUrl: string;
  }

  export function templateAdminComprobanteSubido(
    data: EmailAdminComprobanteSubidoData,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 24px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <h1 style="color: #1f2937; margin-top: 0; font-size: 20px;">📎 Nuevo comprobante para revisar</h1>
          <p style="color: #4b5563; line-height: 1.6;">
            <strong>${esc(data.customerName)}</strong> (${esc(data.customerEmail)}) subió el
            comprobante de pago para <strong>${esc(data.className)}</strong>
            (${esc(String(data.cupos))} ${data.cupos === 1 ? "persona" : "personas"}).
          </p>
          <p style="margin-top: 20px;">
            <a href="${esc(data.reviewUrl)}" style="display: inline-block; background-color: #d97706; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none; font-weight: bold;">
              Revisar en el panel
            </a>
          </p>
        </div>
      </body>
      </html>
    `;
  }

  export interface EmailAdminReservaNuevaData {
    customerName: string;
    customerEmail: string;
    customerPhone: string | null;
    className: string;
    classDate: string;
    cupos: number;
    reviewUrl: string;
  }

  export function templateAdminReservaNueva(
    data: EmailAdminReservaNuevaData,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 24px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <h1 style="color: #1f2937; margin-top: 0; font-size: 20px;">🆕 Nueva reserva pendiente de pago</h1>
          <p style="color: #4b5563; line-height: 1.6;">
            <strong>${esc(data.customerName)}</strong> (${esc(data.customerEmail)}${data.customerPhone ? ` · ${esc(data.customerPhone)}` : ""})
            reservó <strong>${esc(String(data.cupos))} ${data.cupos === 1 ? "cupo" : "cupos"}</strong>
            para <strong>${esc(data.className)}</strong> (${esc(data.classDate)}).
          </p>
          <p style="color: #6b7280; font-size: 13px; line-height: 1.6;">
            Todavía no pagó. Vas a recibir otro aviso cuando suba el comprobante,
            o podés revisar el estado ahora en el panel.
          </p>
          <p style="margin-top: 20px;">
            <a href="${esc(data.reviewUrl)}" style="display: inline-block; background-color: #d97706; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none; font-weight: bold;">
              Ver en el panel
            </a>
          </p>
        </div>
      </body>
      </html>
    `;
  }

  export interface EmailAdminConsultaNuevaData {
    customerName: string;
    customerEmail: string;
    typeLabel: string;
    message: string | null;
    reviewUrl: string;
  }

  export function templateAdminConsultaNueva(
    data: EmailAdminConsultaNuevaData,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 24px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <h1 style="color: #1f2937; margin-top: 0; font-size: 20px;">✉️ Nueva consulta: ${esc(data.typeLabel)}</h1>
          <p style="color: #4b5563; line-height: 1.6;">
            <strong>${esc(data.customerName)}</strong> (${esc(data.customerEmail)}) escribió por
            <strong>${esc(data.typeLabel)}</strong>.
          </p>
          ${data.message
            ? `<p style="margin: 16px 0; padding: 12px 16px; background-color: #f3f4f6; border-radius: 4px; color: #374151; font-size: 14px; white-space: pre-line;">${esc(data.message)}</p>`
            : ""}
          <p style="margin-top: 20px;">
            <a href="${esc(data.reviewUrl)}" style="display: inline-block; background-color: #d97706; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none; font-weight: bold;">
              Ver en el panel
            </a>
          </p>
        </div>
      </body>
      </html>
    `;
  }

  export interface EmailAdminDigestClase {
    title: string;
    dateLabel: string;
    spotsLeft: number;
    totalSpots: number;
    statusLabel: string;
    isEvento: boolean;
  }

  export interface EmailAdminDigestData {
    dateLabel: string;
    comprobantesPendientes: number;
    consultasNuevas: number;
    proximasClases: EmailAdminDigestClase[];
    fallasPermanentes: number;
    panelUrl: string;
  }

  export function templateAdminDigest(data: EmailAdminDigestData): string {
    const linea = (label: string, n: number) =>
      n > 0
        ? `<li style="margin: 4px 0; color: #1f2937;"><strong>${esc(String(n))}</strong> ${esc(label)}</li>`
        : "";

    const pendientes = [
      linea(
        data.comprobantesPendientes === 1
          ? "comprobante sin revisar"
          : "comprobantes sin revisar",
        data.comprobantesPendientes,
      ),
      linea(
        data.consultasNuevas === 1 ? "consulta sin leer" : "consultas sin leer",
        data.consultasNuevas,
      ),
      linea(
        data.fallasPermanentes === 1
          ? "aviso por email que no se pudo enviar"
          : "avisos por email que no se pudieron enviar",
        data.fallasPermanentes,
      ),
    ]
      .filter(Boolean)
      .join("");

    const clasesRows = data.proximasClases
      .map(
        (c) => `
        <tr>
          <td style="padding: 6px 12px 6px 0; color: #4b5563; white-space: nowrap;">${esc(c.dateLabel)}</td>
          <td style="padding: 6px 12px 6px 0; color: #1f2937;">${esc(c.title)}</td>
          <td style="padding: 6px 12px 6px 0; color: #4b5563; white-space: nowrap;">${c.isEvento ? "—" : `${esc(String(c.spotsLeft))}/${esc(String(c.totalSpots))}`}</td>
          <td style="padding: 6px 0; color: #6b7280;">${esc(c.statusLabel)}</td>
        </tr>`,
      )
      .join("");

    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 24px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <h1 style="color: #1f2937; margin-top: 0; font-size: 20px;">☀️ Resumen del día — ${esc(data.dateLabel)}</h1>

          ${
            pendientes
              ? `<p style="color: #4b5563; margin: 16px 0 4px 0;">Necesita tu atención:</p>
                 <ul style="margin: 0 0 8px 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">${pendientes}</ul>`
              : `<p style="color: #4b5563; margin: 16px 0;">No hay nada pendiente de revisar. 👌</p>`
          }

          ${
            clasesRows
              ? `<p style="color: #4b5563; margin: 20px 0 4px 0;">Próximas clases:</p>
                 <table style="font-size: 14px; border-collapse: collapse; width: 100%;">${clasesRows}</table>`
              : ""
          }

          <p style="margin-top: 24px;">
            <a href="${esc(data.panelUrl)}" style="display: inline-block; background-color: #d97706; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none; font-weight: bold;">
              Abrir el panel
            </a>
          </p>
        </div>
      </body>
      </html>
    `;
  }

  export interface EmailAdminLowOccupancyData {
    className: string;
    classDateLabel: string;
    spotsLeft: number;
    totalSpots: number;
    occupancyPct: number;
    panelUrl: string;
  }

  export function templateAdminLowOccupancy(
    data: EmailAdminLowOccupancyData,
  ): string {
    const reservados = data.totalSpots - data.spotsLeft;
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 24px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <h1 style="color: #1f2937; margin-top: 0; font-size: 20px;">📉 Clase con pocas reservas</h1>
          <p style="color: #4b5563; line-height: 1.6;">
            <strong>${esc(data.className)}</strong> es el <strong>${esc(data.classDateLabel)}</strong>
            (en 4 días) y va <strong>${esc(String(reservados))} de ${esc(String(data.totalSpots))}</strong>
            cupos ocupados (${esc(String(data.occupancyPct))}%).
          </p>
          <p style="color: #6b7280; font-size: 13px; line-height: 1.6;">
            Todavía hay tiempo de promocionarla, o de decidir si la cancelás avisando a quienes
            ya reservaron.
          </p>
          <p style="margin-top: 20px;">
            <a href="${esc(data.panelUrl)}" style="display: inline-block; background-color: #d97706; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none; font-weight: bold;">
              Ver la clase
            </a>
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

