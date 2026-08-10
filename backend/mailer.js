const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '25', 10);
const SMTP_EMAIL = process.env.SMTP_EMAIL;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const FROM_NAME = process.env.FROM_NAME || 'SOL RABOZZI - MIS 15';
const FROM_EMAIL = process.env.FROM_EMAIL || SMTP_EMAIL;

// Configurar transportador si existe configuración de SMTP
let transporter = null;
if (SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true para 465, false para otros puertos
    auth: SMTP_EMAIL && SMTP_PASSWORD ? {
      user: SMTP_EMAIL,
      pass: SMTP_PASSWORD
    } : undefined,
    tls: {
      rejectUnauthorized: false // Evitar fallos por certificados autofirmados
    }
  });
}

/**
 * Envía una notificación por correo electrónico a los organizadores detallando el RSVP.
 */
async function sendRsvpNotification(rsvp, asistentes) {
  if (!transporter) {
    console.log('Servicio de correo SMTP no configurado (falta SMTP_HOST en el entorno).');
    return;
  }

  const asistentesHtml = asistentes.map((a, idx) => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${idx + 1}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${a.nombre} ${a.apellido}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${a.email || 'No especificado'}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${a.tipo_asistente === 'menor' ? 'Menor' : 'Adulto'}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${a.restriccion_alimentaria || 'Ninguna'} ${a.restriccion_alimentaria_detalle ? `(${a.restriccion_alimentaria_detalle})` : ''}</td>
    </tr>
  `).join('');

  const mailOptions = {
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to: FROM_EMAIL, // Se envía al correo del organizador
    subject: `Nueva confirmación: ${rsvp.nombre} ${rsvp.apellido} (${asistentes.length} personas)`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; background-color: #ffffff;">
        <h2 style="color: #6b21a8; border-bottom: 2px solid #6b21a8; padding-bottom: 10px; margin-top: 0;">¡Nueva confirmación de asistencia!</h2>
        <p>Se ha registrado una nueva confirmación para la fiesta de 15 de <strong>Sol Rabozzi</strong>:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #edf2f7; width: 40%;">Responsable:</td>
            <td style="padding: 8px; border-bottom: 1px solid #edf2f7;">${rsvp.nombre} ${rsvp.apellido}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #edf2f7;">Teléfono:</td>
            <td style="padding: 8px; border-bottom: 1px solid #edf2f7;">${rsvp.telefono}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #edf2f7;">Email:</td>
            <td style="padding: 8px; border-bottom: 1px solid #edf2f7;">${rsvp.email}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #edf2f7;">Cantidad de Personas:</td>
            <td style="padding: 8px; border-bottom: 1px solid #edf2f7;">${rsvp.cantidad_personas}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #edf2f7;">Modalidad de Pago:</td>
            <td style="padding: 8px; border-bottom: 1px solid #edf2f7;">${rsvp.modalidad_pago === 'ahora' ? 'Transferencia (Comprobante adjunto)' : 'Pagar después'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #edf2f7;">Importe Total:</td>
            <td style="padding: 8px; border-bottom: 1px solid #edf2f7; font-weight: bold; color: #0f766e;">$${rsvp.importe_total}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #edf2f7;">Observaciones:</td>
            <td style="padding: 8px; border-bottom: 1px solid #edf2f7;">${rsvp.observaciones || 'Ninguna'}</td>
          </tr>
        </table>

        <h3 style="color: #4c1d95; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Detalle de Asistentes</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
          <thead>
            <tr style="background-color: #f7fafc;">
              <th style="padding: 8px; border: 1px solid #ddd;">#</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Nombre y Apellido</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Email</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Tipo</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Restricciones Alimentarias</th>
            </tr>
          </thead>
          <tbody>
            ${asistentesHtml}
          </tbody>
        </table>
        
        <div style="background-color: #f8fafc; border-left: 4px solid #6b21a8; padding: 12px; font-size: 14px; border-radius: 4px; margin-top: 20px;">
          <p style="margin: 0; font-weight: bold;">Acción sugerida:</p>
          <p style="margin: 5px 0 0 0;">Ingresa al panel de administración para verificar el comprobante de pago y confirmar la asistencia definitivamente.</p>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email de notificación enviado con éxito: ${info.messageId} (Responsable: ${rsvp.nombre} ${rsvp.apellido})`);
    return info;
  } catch (error) {
    console.error('Error al enviar email de notificación SMTP:', error);
    throw error;
  }
}

module.exports = {
  sendRsvpNotification
};
