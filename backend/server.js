require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const db = require('./db');
const mailer = require('./mailer');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123_change_this_in_production';

// Asegurar directorio de subidas existente
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuración de CORS
app.use(cors());

// Middleware para JSON y urlencoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de Multer para comprobantes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de archivo no permitido. Solo se admiten JPG, PNG y PDF.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  }
});

// Middleware de Autenticación para Administrador
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso denegado. No autorizado.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido o expirado.' });
  }
};

// --- ENDPOINTS PÚBLICOS ---

// Endpoint para verificar registro por DNI
app.get('/api/rsvp/verify/:dni', async (req, res) => {
  try {
    const { dni } = req.params;
    if (!dni) {
      return res.status(400).json({ error: 'El DNI es requerido.' });
    }

    const invitation = await db.getInvitacionByDni(dni);
    if (!invitation) {
      return res.status(404).json({ error: 'No se encontró ninguna confirmación registrada con ese DNI.' });
    }

    res.json(invitation);
  } catch (err) {
    console.error('Error al verificar RSVP por DNI:', err);
    res.status(500).json({ error: 'Error interno del servidor al verificar la confirmación.' });
  }
});

// Endpoint para guardar RSVP o actualizar (admite subida de archivo opcional)
app.post('/api/rsvp', upload.single('comprobante'), async (req, res) => {
  try {
    const { dni, nombre, apellido, telefono, email, cantidad_personas, modalidad_pago, importe_total, observaciones, asistentes } = req.body;

    // Validaciones básicas de datos obligatorios (RNF-010)
    if (!dni || !nombre || !apellido || !telefono || !email || !cantidad_personas || !modalidad_pago || !importe_total) {
      return res.status(400).json({ error: 'Faltan campos obligatorios para registrar la asistencia.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'El correo electrónico ingresado no es válido.' });
    }

    let parsedAsistentes = [];
    if (asistentes) {
      try {
        parsedAsistentes = typeof asistentes === 'string' ? JSON.parse(asistentes) : asistentes;
      } catch (err) {
        return res.status(400).json({ error: 'El listado de asistentes tiene un formato inválido.' });
      }
    }

    // Validar datos obligatorios y formato de email para cada asistente
    if (parsedAsistentes && parsedAsistentes.length > 0) {
      for (const asis of parsedAsistentes) {
        if (!asis.nombre || !asis.nombre.trim() || !asis.apellido || !asis.apellido.trim() || !asis.email || !asis.email.trim()) {
          return res.status(400).json({ error: 'Todos los asistentes deben tener nombre, apellido y correo electrónico.' });
        }
        if (!emailRegex.test(asis.email.trim())) {
          return res.status(400).json({ error: `El correo electrónico '${asis.email}' de uno de los asistentes no es válido.` });
        }
      }
    }


    // Verificar si ya existe una invitación con este DNI
    const existing = await db.getInvitacionByDni(dni);
    let result;

    if (existing) {
      // Si ya existe, se actualizan los datos
      const comprobanteData = req.file ? {
        archivo: req.file.filename,
        tipo_archivo: req.file.mimetype,
        fecha_carga: new Date()
      } : existing.comprobante; // Mantener comprobante anterior si no se sube uno nuevo

      const invitacionData = {
        nombre,
        apellido,
        telefono,
        email,
        cantidad_personas,
        modalidad_pago,
        importe_total,
        observaciones,
        comprobante: comprobanteData
      };

      result = await db.updateInvitacion(existing.id, invitacionData, parsedAsistentes);
    } else {
      // Si no existe, se crea una nueva
      const comprobanteData = req.file ? {
        archivo: req.file.filename,
        tipo_archivo: req.file.mimetype,
        fecha_carga: new Date()
      } : {
        archivo: '',
        tipo_archivo: '',
        fecha_carga: null
      };

      const invitacionData = {
        dni,
        nombre,
        apellido,
        telefono,
        email,
        cantidad_personas,
        modalidad_pago,
        importe_total,
        observaciones,
        comprobante: comprobanteData
      };

      result = await db.createInvitacion(invitacionData, parsedAsistentes);
    }

    // Enviar notificación por correo de manera asincrónica sin bloquear la respuesta HTTP
    mailer.sendRsvpNotification(result, result.asistentes || parsedAsistentes).catch(mailErr => {
      console.error('Error al enviar la notificación por correo del RSVP:', mailErr);
    });

    // Enviar correos de invitación a cada uno de los asistentes de manera asincrónica
    const asistentesList = result.asistentes || parsedAsistentes;
    if (asistentesList && asistentesList.length > 0) {
      asistentesList.forEach(asis => {
        if (asis.email && asis.email.trim()) {
          mailer.sendGuestInvitationEmail(result, asis).catch(mailErr => {
            console.error(`Error al enviar el email de invitación a ${asis.nombre} (${asis.email}):`, mailErr);
          });
        }
      });
    }

    // Mensajes de resultado sugeridos en RF-038 y RF-039
    if (modalidad_pago === 'ahora') {
      return res.status(201).json({
        success: true,
        message: existing 
          ? '¡Gracias! Actualizamos tu confirmación y comprobante para los 15 de Sol. Cuando verifiquemos el pago tu asistencia quedará confirmada definitivamente.'
          : '¡Gracias! Recibimos tu confirmación para los 15 de Sol. Cuando verifiquemos el pago tu asistencia quedará confirmada definitivamente.',
        data: result
      });
    } else {
      return res.status(201).json({
        success: true,
        message: existing
          ? '¡Gracias! Actualizamos los datos de tu confirmación para los 15 de Sol. Tu pago se encuentra pendiente.'
          : '¡Gracias por confirmar! Reservamos tu lugar para los 15 de Sol. Tu pago se encuentra pendiente.',
        data: result
      });
    }

  } catch (err) {
    console.error('Error al registrar RSVP:', err);
    res.status(500).json({ error: err.message || 'Error interno del servidor al procesar la confirmación.' });
  }
});

// --- ENDPOINTS ADMINISTRATIVOS ---

// Login de Administrador
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos.' });
    }

    const isValid = await db.verifyAdmin(username, password);
    if (isValid) {
      const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '12h' });
      return res.json({ token });
    } else {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }
  } catch (err) {
    console.error('Error en login de administrador:', err);
    res.status(500).json({ error: 'Error interno del servidor al procesar el inicio de sesión.' });
  }
});

// Listar confirmaciones registradas
app.get('/api/admin/rsvps', authenticateAdmin, async (req, res) => {
  try {
    const rsvps = await db.getAllInvitaciones();
    res.json(rsvps);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener el listado de confirmaciones.' });
  }
});

// Obtener indicadores generales
app.get('/api/admin/stats', authenticateAdmin, async (req, res) => {
  try {
    const stats = await db.getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener estadísticas del evento.' });
  }
});

// Verificar pago o actualizar estados administrativamente
app.post('/api/admin/rsvps/:id/verify', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { estado_pago, estado_asistencia } = req.body;

    if (!estado_pago && !estado_asistencia) {
      return res.status(400).json({ error: 'Se requiere al menos un estado para actualizar.' });
    }

    const updated = await db.updateInvitacionStatus(id, estado_pago, estado_asistencia);
    if (!updated) {
      return res.status(404).json({ error: 'Invitación no encontrada.' });
    }

    // Enviar correos de invitación actualizados a cada uno de los asistentes de manera asincrónica
    const asistentesList = updated.asistentes || [];
    if (asistentesList && asistentesList.length > 0) {
      asistentesList.forEach(asis => {
        if (asis.email && asis.email.trim()) {
          mailer.sendGuestInvitationEmail(updated, asis).catch(mailErr => {
            console.error(`Error al enviar la invitación actualizada por correo a ${asis.nombre} (${asis.email}):`, mailErr);
          });
        }
      });
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar el estado de la invitación.' });
  }
});

// Acceso protegido y controlado a los comprobantes de pago (RNF-005)
app.get('/api/admin/comprobantes/:filename', authenticateAdmin, (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(uploadsDir, filename);

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'Archivo comprobante no encontrado.' });
  }
});

// Exportar información en formato CSV (RF-057)
app.get('/api/admin/rsvps/export/csv', authenticateAdmin, async (req, res) => {
  try {
    const rsvps = await db.getAllInvitaciones();
    
    // Encabezados
    let csvContent = 'ID_Invitacion;DNI;Responsable;Telefono;Email_Responsable;Cant_Asistentes;Importe_Total;Modalidad_Pago;Estado_Pago;Estado_Asistencia;Nombre_Asistente;Apellido_Asistente;Email_Asistente;Tipo_Asistente;Restriccion_Alimentaria;Restriccion_Detalle;Mesa\n';

    rsvps.forEach(rsvp => {
      const responsable = `"${rsvp.nombre} ${rsvp.apellido}"`;
      const id = rsvp.id;
      const dni = rsvp.dni || '';
      const tel = `"${rsvp.telefono}"`;
      const emailResponsable = `"${rsvp.email || ''}"`;
      const cant = rsvp.cantidad_personas;
      const total = rsvp.importe_total;
      const mod = rsvp.modalidad_pago;
      const estPago = rsvp.estado_pago;
      const estAsis = rsvp.estado_asistencia;

      if (rsvp.asistentes && rsvp.asistentes.length > 0) {
        rsvp.asistentes.forEach(asis => {
          csvContent += `${id};${dni};${responsable};${tel};${emailResponsable};${cant};${total};${mod};${estPago};${estAsis};"${asis.nombre}";"${asis.apellido}";"${asis.email || ''}";"${asis.tipo_asistente}";"${asis.restriccion_alimentaria}";"${asis.restriccion_alimentaria_detalle || ''}";"${asis.mesa || ''}"\n`;
        });
      } else {
        // En caso de que no haya asistentes guardados en detalle por algún motivo
        csvContent += `${id};${dni};${responsable};${tel};${emailResponsable};${cant};${total};${mod};${estPago};${estAsis};;;;;;;\n`;
      }
    });

    // Enviar archivo como descarga con codificación UTF-8 para admitir caracteres especiales como eñes o acentos
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=asistentes_sol_rabozzi.csv');
    // Agregar UTF-8 BOM
    res.write(Buffer.from('\uFEFF'));
    res.end(csvContent);
  } catch (err) {
    console.error('Error al exportar CSV:', err);
    res.status(500).json({ error: 'Error al generar la exportación a CSV.' });
  }
});

// Cambiar contraseña de administrador (Autenticado)
app.post('/api/admin/change-password', authenticateAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { username } = req.admin; // Decodificado del JWT en authenticateAdmin

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Se requiere la contraseña actual y la nueva contraseña.' });
    }

    const isValid = await db.verifyAdmin(username, currentPassword);
    if (!isValid) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta.' });
    }

    // Actualizar en la base de datos
    await db.updateAdminPassword(username, newPassword);

    res.json({ success: true, message: 'Contraseña actualizada exitosamente.' });
  } catch (err) {
    console.error('Error al cambiar contraseña de administrador:', err);
    res.status(500).json({ error: 'Error interno del servidor al cambiar la contraseña.' });
  }
});

// Obtener tema actual (Público)
app.get('/api/settings/theme', async (req, res) => {
  try {
    const theme = await db.getThemeSetting();
    res.json({ theme });
  } catch (err) {
    console.error('Error al obtener tema:', err);
    res.status(500).json({ error: 'Error al obtener configuración del tema.' });
  }
});

// Cambiar tema de la página (Administrativo Autenticado)
app.post('/api/admin/settings/theme', authenticateAdmin, async (req, res) => {
  try {
    const { theme } = req.body;
    console.log('Received theme update request:', req.body);
    // Allow 'party' theme in addition to dark and light
    if (theme !== 'dark' && theme !== 'light' && theme !== 'party') {
      return res.status(400).json({ error: 'Tema inválido. Debe ser "dark", "light" o "party".' });
    }
    await db.setThemeSetting(theme);
    res.json({ success: true, theme });
  } catch (err) {
    console.error('Error al cambiar tema:', err);
    res.status(500).json({ error: 'Error al guardar configuración del tema.' });
  }
});

// Middleware global para manejo de errores de Multer
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'El archivo es demasiado grande. El límite es de 5 MB.' });
    }
    return res.status(400).json({ error: `Error de carga de archivo: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

// Inicialización de la Base de Datos y arranque del servidor
db.init().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor Express corriendo exitosamente en el puerto ${PORT}`);
  });
}).catch(err => {
  console.error('Fallo crítico al iniciar la base de datos:', err);
});
