/**
 * Templates HTML de emails. Simples pero funcionales.
 */

export interface EmailReservaConfirmacionData {
    customerName: string;
    customerEmail: string;
    className: string;
    classDate: string; // "Sábado 17 de mayo de 2026"
    classTime: string; // "18:00 - 21:00"
    paymentLink?: string | null;
    cupos: number;
  }
  
  export function templateReservaConfirmacion(
    data: EmailReservaConfirmacionData,
  ): string {
    const paymentSection = data.paymentLink
      ? `
      <div style="margin-top: 24px; padding: 16px; background-color: #fff8f3; border-left: 4px solid #d97706;">
        <p style="margin: 0; font-weight: bold; color: #1f2937;">Falta pagar la seña</p>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #4b5563;">
          Hacé clic en el botón para completar el pago:
        </p>
        <a href="${data.paymentLink}" style="display: inline-block; margin-top: 12px; padding: 12px 24px; background-color: #d97706; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Pagar seña
        </a>
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
              Hola <strong>${data.customerName}</strong>,
            </p>
  
            <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
              Recibimos tu reserva para la clase de <strong>${data.className}</strong>. 
              Aquí están los detalles:
            </p>
  
            <!-- Detalles -->
            <div style="background-color: #f3f4f6; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
              <div style="margin-bottom: 12px;">
                <span style="font-weight: bold; color: #1f2937;">Clase:</span>
                <span style="color: #4b5563;">${data.className}</span>
              </div>
              <div style="margin-bottom: 12px;">
                <span style="font-weight: bold; color: #1f2937;">Fecha:</span>
                <span style="color: #4b5563;">${data.classDate}</span>
              </div>
              <div style="margin-bottom: 12px;">
                <span style="font-weight: bold; color: #1f2937;">Horario:</span>
                <span style="color: #4b5563;">${data.classTime}</span>
              </div>
              <div>
                <span style="font-weight: bold; color: #1f2937;">Cupos:</span>
                <span style="color: #4b5563;">${data.cupos}</span>
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
  
  export interface EmailAdminNewReservaData {
    customerName: string;
    customerEmail: string;
    customerPhone?: string | null;
    className: string;
    classDate: string;
    cupos: number;
    notes?: string | null;
  }
  
  export function templateAdminNewReserva(data: EmailAdminNewReservaData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nueva reserva</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="margin: 0; font-size: 24px; color: #1f2937;">
              📬 Nueva reserva recibida
            </h1>
          </div>
  
          <!-- Body -->
          <div style="background-color: white; padding: 24px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <p style="margin: 0 0 16px 0; font-size: 16px; color: #1f2937;">
              Datos del cliente:
            </p>
  
            <div style="background-color: #f3f4f6; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
              <div style="margin-bottom: 12px;">
                <span style="font-weight: bold; color: #1f2937;">Nombre:</span>
                <span style="color: #4b5563;">${data.customerName}</span>
              </div>
              <div style="margin-bottom: 12px;">
                <span style="font-weight: bold; color: #1f2937;">Email:</span>
                <span style="color: #4b5563;">${data.customerEmail}</span>
              </div>
              ${data.customerPhone ? `
              <div style="margin-bottom: 12px;">
                <span style="font-weight: bold; color: #1f2937;">Teléfono:</span>
                <span style="color: #4b5563;">${data.customerPhone}</span>
              </div>
              ` : ""}
            </div>
  
            <p style="margin: 0 0 16px 0; font-size: 16px; color: #1f2937;">
              Detalles de la reserva:
            </p>
  
            <div style="background-color: #fef3c7; padding: 16px; border-radius: 4px; margin-bottom: 24px; border-left: 4px solid #d97706;">
              <div style="margin-bottom: 12px;">
                <span style="font-weight: bold; color: #1f2937;">Clase:</span>
                <span style="color: #4b5563;">${data.className}</span>
              </div>
              <div style="margin-bottom: 12px;">
                <span style="font-weight: bold; color: #1f2937;">Fecha:</span>
                <span style="color: #4b5563;">${data.classDate}</span>
              </div>
              <div>
                <span style="font-weight: bold; color: #1f2937;">Cupos:</span>
                <span style="color: #4b5563;">${data.cupos}</span>
              </div>
            </div>
  
            ${data.notes ? `
            <div style="background-color: #f0f9ff; padding: 12px; border-radius: 4px; margin-bottom: 24px; border-left: 4px solid #0284c7;">
              <p style="margin: 0; font-size: 13px; color: #0c4a6e;">
                <strong>Notas del cliente:</strong> "${data.notes}"
              </p>
            </div>
            ` : ""}
  
            <p style="margin: 0; font-size: 13px; color: #6b7280;">
              <a href="https://menesteres.com/admin/reservas" style="color: #0284c7; text-decoration: none; font-weight: bold;">
                Ver en el panel de admin →
              </a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }