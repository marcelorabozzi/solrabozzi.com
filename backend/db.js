const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

// Variables de entorno
const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/mis15';

let mongoose = null;
let InvitationModel = null;
let AssistentModel = null;
let AdminModel = null;
let SettingsModel = null;

// Inicialización del sistema de persistencia (Exclusivo MongoDB)
async function init() {
  try {
    mongoose = require('mongoose');
    await mongoose.connect(MONGODB_URI);
    console.log('Conectado exitosamente a MongoDB');

    // Definición de Schemas Mongoose
    const InvitationSchema = new mongoose.Schema({
      id: { type: String, required: true, unique: true },
      dni: { type: String, required: true, unique: true },
      nombre: { type: String, required: true },
      apellido: { type: String, required: true },
      telefono: { type: String, required: true },
      email: { type: String, required: true },
      cantidad_personas: { type: Number, required: true },
      fecha_confirmacion: { type: Date, default: Date.now },
      modalidad_pago: { type: String, enum: ['ahora', 'despues'], required: true },
      estado_asistencia: { type: String, default: 'confirmado' },
      estado_pago: { type: String, enum: ['pendiente', 'a_verificar', 'verificado'], default: 'pendiente' },
      importe_total: { type: Number, required: true },
      observaciones: { type: String, default: '' },
      comprobante: {
        archivo: { type: String, default: '' },
        tipo_archivo: { type: String, default: '' },
        fecha_carga: { type: Date }
      },
      fecha_creacion: { type: Date, default: Date.now },
      fecha_actualizacion: { type: Date, default: Date.now }
    });

    const AssistentSchema = new mongoose.Schema({
      id: { type: String, required: true, unique: true },
      invitacion_id: { type: String, required: true },
      nombre: { type: String, required: true },
      apellido: { type: String, required: true },
      email: { type: String, default: '' },
      tipo_asistente: { type: String, enum: ['adulto', 'menor'], required: true },
      restriccion_alimentaria: { 
        type: String, 
        enum: ['celiaquia', 'vegetarianismo', 'veganismo', 'alergias', 'ninguna'], 
        default: 'ninguna' 
      },
      restriccion_alimentaria_detalle: { type: String, default: '' },
      mesa: { type: String, default: '' },
      estado_asistencia: { type: String, enum: ['ausente', 'presente'], default: 'ausente' },
      fecha_ingreso: { type: Date, default: null }
    });

    const AdminSchema = new mongoose.Schema({
      username: { type: String, required: true, unique: true },
      passwordHash: { type: String, required: true },
      fecha_creacion: { type: Date, default: Date.now }
    });

    const SettingsSchema = new mongoose.Schema({
      key: { type: String, required: true, unique: true },
      value: { type: String, required: true }
    });

    InvitationModel = mongoose.model('Invitation', InvitationSchema);
    AssistentModel = mongoose.model('Assistent', AssistentSchema);
    AdminModel = mongoose.model('Admin', AdminSchema);
    SettingsModel = mongoose.model('Settings', SettingsSchema);

    // Sembrar administrador por defecto automáticamente
    await seedAdmin('marcelo', 'ss151100**');
    await seedAdmin('luciana', '111111');

  } catch (err) {
    console.error('Error crítico conectando a MongoDB:', err);
    throw err; // Impedir que el backend inicie sin base de datos
  }
}

// Hashing de contraseñas con crypto nativo
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Sembrar administrador
async function seedAdmin(username, password) {
  if (!AdminModel) return;
  const existing = await AdminModel.findOne({ username }).lean();
  if (!existing) {
    console.log(`Sembrando usuario administrador por defecto: ${username}...`);
    const passwordHash = hashPassword(password);
    await AdminModel.create({ username, passwordHash });
    console.log(`Usuario administrador ${username} creado con éxito.`);
  }
}

// Verificar credenciales de administrador
async function verifyAdmin(username, password) {
  if (!AdminModel) return false;
  const admin = await AdminModel.findOne({ username }).lean();
  if (!admin) return false;
  const passwordHash = hashPassword(password);
  return admin.passwordHash === passwordHash;
}

// Obtener tema actual
async function getThemeSetting() {
  if (!SettingsModel) return 'dark';
  const setting = await SettingsModel.findOne({ key: 'theme' }).lean();
  return setting ? setting.value : 'dark';
}

// Guardar tema actual
async function setThemeSetting(themeValue) {
  if (!SettingsModel) throw new Error('Base de datos no inicializada');
  const result = await SettingsModel.findOneAndUpdate(
    { key: 'theme' },
    { value: themeValue },
    { new: true, upsert: true }
  );
  return result;
}

// API de Base de Datos
async function getAllInvitaciones() {
  const invites = await InvitationModel.find().lean();
  for (let invite of invites) {
    invite.asistentes = await AssistentModel.find({ invitacion_id: invite.id }).lean();
  }
  return invites;
}

async function getInvitacionById(id) {
  const invite = await InvitationModel.findOne({ id }).lean();
  if (!invite) return null;
  invite.asistentes = await AssistentModel.find({ invitacion_id: id }).lean();
  return invite;
}

async function createInvitacion(invitacionData, asistentesData) {
  const newInviteId = uuidv4();
  const now = new Date();

  const newInvitation = {
    id: newInviteId,
    dni: invitacionData.dni,
    nombre: invitacionData.nombre,
    apellido: invitacionData.apellido,
    telefono: invitacionData.telefono,
    email: invitacionData.email,
    cantidad_personas: parseInt(invitacionData.cantidad_personas, 10),
    fecha_confirmacion: now,
    modalidad_pago: invitacionData.modalidad_pago,
    estado_asistencia: 'confirmado',
    estado_pago: invitacionData.modalidad_pago === 'ahora' ? 'a_verificar' : 'pendiente',
    importe_total: parseFloat(invitacionData.importe_total),
    observaciones: invitacionData.observaciones || '',
    comprobante: invitacionData.comprobante || {
      archivo: '',
      tipo_archivo: '',
      fecha_carga: null
    },
    fecha_creacion: now,
    fecha_actualizacion: now
  };

  const newAsistentes = (asistentesData || []).map(a => ({
    id: uuidv4(),
    invitacion_id: newInviteId,
    nombre: a.nombre,
    apellido: a.apellido,
    email: a.email || '',
    tipo_asistente: a.tipo_asistente || 'adulto',
    restriccion_alimentaria: a.restriccion_alimentaria || 'ninguna',
    restriccion_alimentaria_detalle: a.restriccion_alimentaria_detalle || '',
    mesa: ''
  }));

  const createdInvite = await InvitationModel.create(newInvitation);
  const createdAsistentes = await AssistentModel.insertMany(newAsistentes);
  const result = createdInvite.toObject();
  result.asistentes = createdAsistentes.map(a => a.toObject());
  return result;
}

async function getInvitacionByDni(dni) {
  const invite = await InvitationModel.findOne({ dni }).lean();
  if (!invite) return null;
  invite.asistentes = await AssistentModel.find({ invitacion_id: invite.id }).lean();
  return invite;
}

async function updateInvitacion(id, invitacionData, asistentesData) {
  const now = new Date();
  
  const updatedInvitation = {
    nombre: invitacionData.nombre,
    apellido: invitacionData.apellido,
    telefono: invitacionData.telefono,
    email: invitacionData.email,
    cantidad_personas: parseInt(invitacionData.cantidad_personas, 10),
    modalidad_pago: invitacionData.modalidad_pago,
    importe_total: parseFloat(invitacionData.importe_total),
    observaciones: invitacionData.observaciones || '',
    fecha_actualizacion: now
  };

  if (invitacionData.comprobante) {
    updatedInvitation.comprobante = invitacionData.comprobante;
    if (invitacionData.comprobante.archivo) {
      updatedInvitation.estado_pago = 'a_verificar';
    }
  }

  const updatedAsistentes = (asistentesData || []).map(a => ({
    id: a.id || uuidv4(),
    invitacion_id: id,
    nombre: a.nombre,
    apellido: a.apellido,
    email: a.email || '',
    tipo_asistente: a.tipo_asistente || 'adulto',
    restriccion_alimentaria: a.restriccion_alimentaria || 'ninguna',
    restriccion_alimentaria_detalle: a.restriccion_alimentaria_detalle || '',
    mesa: a.mesa || ''
  }));

  const updated = await InvitationModel.findOneAndUpdate({ id }, updatedInvitation, { new: true }).lean();
  await AssistentModel.deleteMany({ invitacion_id: id });
  const insertedAsistentes = await AssistentModel.insertMany(updatedAsistentes);
  const result = { ...updated };
  result.asistentes = insertedAsistentes.map(a => a.toObject());
  return result;
}

async function updateInvitacionStatus(id, estado_pago, estado_asistencia) {
  const updates = { fecha_actualizacion: new Date() };
  if (estado_pago) updates.estado_pago = estado_pago;
  if (estado_asistencia) updates.estado_asistencia = estado_asistencia;

  const updated = await InvitationModel.findOneAndUpdate({ id }, updates, { new: true }).lean();
  if (updated) {
    updated.asistentes = await AssistentModel.find({ invitacion_id: id }).lean();
  }
  return updated;
}

async function addComprobante(id, comprobanteData) {
  const updated = await InvitationModel.findOneAndUpdate(
    { id },
    {
      estado_pago: 'a_verificar',
      comprobante: {
        archivo: comprobanteData.archivo,
        tipo_archivo: comprobanteData.tipo_archivo,
        fecha_carga: new Date()
      },
      fecha_actualizacion: new Date()
    },
    { new: true }
  ).lean();
  if (updated) {
    updated.asistentes = await AssistentModel.find({ invitacion_id: id }).lean();
  }
  return updated;
}

async function getStats() {
  const invitations = await getAllInvitaciones();
  
  let totalInvitaciones = invitations.length;
  let personasTotales = 0;
  let pagosVerificados = 0;
  let pagosPendientes = 0;
  let pagosAVerificar = 0;
  let recaudacion = 0;
  let importePendiente = 0;

  invitations.forEach(inv => {
    if (inv.estado_asistencia === 'confirmado') {
      personasTotales += inv.cantidad_personas;
    }

    if (inv.estado_pago === 'verificado') {
      pagosVerificados++;
      recaudacion += inv.importe_total;
    } else if (inv.estado_pago === 'a_verificar') {
      pagosAVerificar++;
      importePendiente += inv.importe_total;
    } else {
      pagosPendientes++;
      importePendiente += inv.importe_total;
    }
  });

  return {
    totalInvitaciones,
    personasTotales,
    pagosVerificados,
    pagosPendientes,
    pagosAVerificar,
    recaudacion,
    importePendiente
  };
}

async function updateAdminPassword(username, newPassword) {
  if (!AdminModel) throw new Error('Base de datos no inicializada');
  const passwordHash = hashPassword(newPassword);
  const result = await AdminModel.findOneAndUpdate(
    { username },
    { passwordHash },
    { new: true }
  );
  if (!result) throw new Error('Usuario administrador no encontrado');
  return result;
}

async function getAssistentById(id) {
  const assistant = await AssistentModel.findOne({ id }).lean();
  if (!assistant) return null;
  const rsvp = await InvitationModel.findOne({ id: assistant.invitacion_id }).lean();
  return { assistant, rsvp };
}

async function checkInAssistent(id) {
  const now = new Date();
  const updatedAssistant = await AssistentModel.findOneAndUpdate(
    { id },
    { estado_asistencia: 'presente', fecha_ingreso: now },
    { new: true }
  ).lean();
  if (!updatedAssistant) return null;
  const rsvp = await InvitationModel.findOne({ id: updatedAssistant.invitacion_id }).lean();
  return { assistant: updatedAssistant, rsvp };
}

module.exports = {
  init,
  getAllInvitaciones,
  getInvitacionById,
  getInvitacionByDni,
  getAssistentById,
  checkInAssistent,
  createInvitacion,
  updateInvitacion,
  updateInvitacionStatus,
  addComprobante,
  getStats,
  verifyAdmin,
  updateAdminPassword,
  getThemeSetting,
  setThemeSetting
};
