const nodemailer = require('nodemailer');
const QRCode = require('qrcode');

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
 * Genera un Buffer PNG con la información del pase del asistente para adjuntar como CID en Nodemailer.
 */
async function generateAssistantQRCodeBuffer(asistente, rsvp) {
  try {
    const qrPayload = JSON.stringify({
      id: asistente.id,
      nombre: `${asistente.nombre} ${asistente.apellido}`,
      dni: rsvp.dni,
      mesa: asistente.mesa || 'A definir',
      tipo: asistente.tipo_asistente === 'menor' ? 'Menor' : 'Adulto',
      evento: '15 SOL RABOZZI',
      estado: 'VERIFICADO'
    });
    return await QRCode.toBuffer(qrPayload, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300,
      color: {
        dark: '#4c1d95',
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('Error generando QR code buffer:', err);
    return null;
  }
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

/**
 * Envía un correo electrónico de invitación personalizado a un invitado/asistente individual.
 */
async function sendGuestInvitationEmail(rsvp, asistente) {
  if (!transporter) {
    console.log('Servicio de correo SMTP no configurado (falta SMTP_HOST en el entorno).');
    return;
  }

  const recipientEmail = (asistente.email && asistente.email.trim()) || rsvp.email;
  if (!recipientEmail) {
    console.log(`No hay email especificado para el asistente ${asistente.nombre} ni para la reserva.`);
    return;
  }

  const nombreCompleto = `${asistente.nombre} ${asistente.apellido}`;
  const esMenor = asistente.tipo_asistente === 'menor';
  const tarjetaDetalle = esMenor ? 'Menor de 12 ($25.000)' : 'Mayor ($50.000)';

  let restriccionDetalle = 'Ninguna';
  if (asistente.restriccion_alimentaria && asistente.restriccion_alimentaria !== 'ninguna') {
    if (asistente.restriccion_alimentaria === 'alergias') {
      restriccionDetalle = asistente.restriccion_alimentaria_detalle || 'Alergias / Otra';
    } else {
      restriccionDetalle = asistente.restriccion_alimentaria.charAt(0).toUpperCase() + asistente.restriccion_alimentaria.slice(1);
    }
  }

  let estadoPagoHtml = '';
  if (rsvp.estado_pago === 'verificado') {
    estadoPagoHtml = '<span style="color: #10b981; font-weight: bold;">✓ Pago Verificado - ¡Ingreso Confirmado!</span>';
  } else if (rsvp.estado_pago === 'a_verificar') {
    estadoPagoHtml = '<span style="color: #f59e0b; font-weight: bold;">⏳ Pago a verificar - Pendiente de validación</span>';
  } else {
    estadoPagoHtml = '<span style="color: #ef4444; font-weight: bold;">⚠️ Pago Pendiente</span>';
  }

  let qrHtmlSection = '';
  const attachments = [];

  if (rsvp.estado_pago === 'verificado') {
    const qrBuffer = await generateAssistantQRCodeBuffer(asistente, rsvp);
    if (qrBuffer) {
      const cidName = `qrcode_${asistente.id ? asistente.id.replace(/[^a-zA-Z0-9]/g, '') : Date.now()}`;
      
      attachments.push({
        filename: `pase_qr_${(asistente.nombre || 'asistente').toLowerCase().replace(/\s+/g, '_')}.png`,
        content: qrBuffer,
        cid: cidName
      });

      qrHtmlSection = `
        <div style="text-align: center; margin: 25px 0; padding: 20px; background-color: rgba(107, 33, 168, 0.2); border: 2px dashed #e2a5a5; border-radius: 12px;">
          <span style="font-size: 1.2rem; font-weight: bold; color: #e2a5a5; display: block; margin-bottom: 8px; letter-spacing: 1px;">🎟️ PASE DE INGRESO INDIVIDUAL (CÓDIGO QR)</span>
          <p style="font-size: 13px; color: #d8b4fe; margin-top: 0; margin-bottom: 15px;">Presentá este código QR desde tu celular o impreso el día de la fiesta en el ingreso.</p>
          <div style="background: #ffffff; padding: 12px; display: inline-block; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
            <img src="cid:${cidName}" alt="Código QR de Ingreso - ${nombreCompleto}" style="width: 200px; height: 200px; display: block; margin: 0 auto;" />
          </div>
          <div style="margin-top: 12px; font-size: 14px; color: #ffffff;">
            <strong>Asistente:</strong> ${nombreCompleto}<br/>
            <span style="font-size: 13px; color: #a78bfa;">Mesa Asignada: <strong>${asistente.mesa || 'A definir'}</strong></span>
          </div>
        </div>
      `;
    }
  }

  const websiteUrl = process.env.WEBSITE_URL || 'https://solrabozzi.com';

  const mailOptions = {
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to: recipientEmail,
    subject: rsvp.estado_pago === 'verificado' 
      ? `🎟️ ¡Tu Pase de Ingreso QR para los 15 de Sol Rabozzi! ✨`
      : `¡Tu invitación a los 15 de Sol Rabozzi! ✨`,
    html: `
      <div style="background-color: #0f0913; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #f3e8ff; max-width: 600px; margin: 0 auto; border: 1px solid #4a1d6d; border-radius: 12px; padding: 30px; background-image: radial-gradient(circle at top, #1e112a 0%, #0f0913 100%);">
        
        <div style="text-align: center; margin-bottom: 25px;">
          <span style="font-size: 2.5rem; color: #e2a5a5;">✨ 𝔖𝔬𝔩 ℜ𝔞𝔟𝔬𝔷𝔷𝔦 ✨</span>
          <h1 style="color: #e2a5a5; font-size: 1.8rem; margin: 10px 0 0 0; font-weight: 300; letter-spacing: 2px;">MIS 15 AÑOS</h1>
        </div>

        <div style="background-color: rgba(30, 17, 42, 0.6); border: 1px solid rgba(226, 165, 165, 0.2); border-radius: 10px; padding: 20px; margin-bottom: 25px;">
          <p style="font-size: 1.1rem; line-height: 1.6; margin-top: 0; text-align: center;">
            ¡Hola, <strong style="color: #ffffff;">${nombreCompleto}</strong>! 
          </p>
          <p style="font-size: 1.05rem; line-height: 1.6; text-align: center; color: #d8b4fe;">
            ${rsvp.estado_pago === 'verificado' 
              ? '¡Tu pago ha sido verificado con éxito! Adjuntamos tu pase de ingreso con código QR.' 
              : 'Hay momentos que son inolvidables, pero compartirlos con quienes más queremos los hace eternos. Te invito a celebrar conmigo esta noche mágica.'}
          </p>
        </div>

        ${qrHtmlSection}

        <h3 style="color: #e2a5a5; border-bottom: 1px solid rgba(226, 165, 165, 0.2); padding-bottom: 8px; margin-top: 0; font-weight: normal; letter-spacing: 1px;">DETALLES DE LA FIESTA</h3>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 15px;">
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid rgba(226, 165, 165, 0.1); color: #d8b4fe; width: 35%;">📅 Fecha y Hora:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid rgba(226, 165, 165, 0.1); font-weight: bold; color: #ffffff;">Sábado 23 de Enero - 21:30 hs</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid rgba(226, 165, 165, 0.1); color: #d8b4fe;">📍 Lugar:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid rgba(226, 165, 165, 0.1); color: #ffffff;">
              <strong>Raphael Eventos</strong><br/>
              <span style="font-size: 13px; color: #a78bfa;">Av. Rafael Nuñez 5241, Córdoba Capital</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid rgba(226, 165, 165, 0.1); color: #d8b4fe;">👔 Vestimenta:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid rgba(226, 165, 165, 0.1); color: #ffffff;">Formal / Elegante Sport</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid rgba(226, 165, 165, 0.1); color: #d8b4fe;">🍽️ Menú / Restricción:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid rgba(226, 165, 165, 0.1); color: #ffffff;">${restriccionDetalle}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid rgba(226, 165, 165, 0.1); color: #d8b4fe;">🍷 Categoría Tarjeta:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid rgba(226, 165, 165, 0.1); color: #ffffff;">${tarjetaDetalle}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid rgba(226, 165, 165, 0.1); color: #d8b4fe;">🚪 Ingreso / Mesa:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid rgba(226, 165, 165, 0.1); color: #ffffff;">
              Mesa asignada: <strong>${asistente.mesa || 'A definir'}</strong><br/>
              <span style="font-size: 12px; color: #a78bfa;">* Presentar el código QR en la entrada para el ingreso al evento.</span>
            </td>
          </tr>
        </table>

        <h3 style="color: #e2a5a5; border-bottom: 1px solid rgba(226, 165, 165, 0.2); padding-bottom: 8px; margin-top: 0; font-weight: normal; letter-spacing: 1px;">ESTADO DE LA CONFIRMACIÓN</h3>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #d8b4fe; width: 35%;">Responsable del Grupo:</td>
            <td style="padding: 8px 0; color: #ffffff;">${rsvp.nombre} ${rsvp.apellido}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #d8b4fe;">DNI Responsable:</td>
            <td style="padding: 8px 0; color: #ffffff;">${rsvp.dni}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #d8b4fe;">Estado del Pago:</td>
            <td style="padding: 8px 0;">${estadoPagoHtml}</td>
          </tr>
        </table>

        <div style="text-align: center; margin-top: 30px; margin-bottom: 15px;">
          <a href="${websiteUrl}" target="_blank" style="background-color: #6b21a8; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; border: 1px solid #e2a5a5; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.3); transition: background-color 0.3s;">
            🔗 Ver Invitación Digital
          </a>
        </div>

        <div style="text-align: center; border-top: 1px solid rgba(226, 165, 165, 0.1); padding-top: 15px; margin-top: 25px; font-size: 12px; color: #a78bfa;">
          Te espero para vivir una noche inolvidable. ¡No faltes!<br/>
          <strong style="color: #e2a5a5; display: block; margin-top: 5px;">Sol Rabozzi</strong>
        </div>

      </div>
    `,
    attachments: attachments.length > 0 ? attachments : undefined
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email de invitación enviado con éxito a ${recipientEmail}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`Error al enviar email de invitación a ${recipientEmail}:`, error);
    throw error;
  }
}

module.exports = {
  sendRsvpNotification,
  sendGuestInvitationEmail,
  generateAssistantQRCodeBuffer
};
