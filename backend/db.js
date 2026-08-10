const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Variables de entorno
const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/mis15';
let DATABASE_TYPE = process.env.DATABASE_TYPE || (process.env.MONGO_URI || process.env.MONGODB_URI ? 'mongodb' : 'json');

let mongoose = null;
let InvitationModel = null;
let AssistentModel = null;

// Ruta del archivo JSON si estamos en modo JSON
const jsonDbDir = path.join(__dirname, 'data');
const jsonDbFile = path.join(jsonDbDir, 'db.json');

// Estructura inicial para base de datos JSON
const initialJsonStructure = {
  invitaciones: [],
  asistentes: []
};

// Función para leer base de datos JSON
async function readJsonDb() {
  try {
    if (!fs.existsSync(jsonDbFile)) {
      if (!fs.existsSync(jsonDbDir)) {
        fs.mkdirSync(jsonDbDir, { recursive: true });
      }
      await fs.promises.writeFile(jsonDbFile, JSON.stringify(initialJsonStructure, null, 2), 'utf-8');
      return initialJsonStructure;
    }
    const data = await fs.promises.readFile(jsonDbFile, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error leyendo base de datos JSON:', err);
    return initialJsonStructure;
  }
}

// Función para escribir base de datos JSON
async function writeJsonDb(data) {
  try {
    if (!fs.existsSync(jsonDbDir)) {
      fs.mkdirSync(jsonDbDir, { recursive: true });
    }
    await fs.promises.writeFile(jsonDbFile, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error escribiendo base de datos JSON:', err);
  }
}

// Inicialización del sistema de persistencia
async function init() {
  if (DATABASE_TYPE === 'mongodb') {
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
        tipo_asistente: { type: String, enum: ['adulto', 'menor'], required: true },
        restriccion_alimentaria: { 
          type: String, 
          enum: ['celiaquia', 'vegetarianismo', 'veganismo', 'alergias', 'ninguna'], 
          default: 'ninguna' 
        },
        restriccion_alimentaria_detalle: { type: String, default: '' },
        mesa: { type: String, default: '' }
      });

      InvitationModel = mongoose.model('Invitation', InvitationSchema);
      AssistentModel = mongoose.model('Assistent', AssistentSchema);

    } catch (err) {
      console.error('Error conectando a MongoDB. Cambiando a almacenamiento local JSON...', err);
      DATABASE_TYPE = 'json';
      await readJsonDb();
    }
  } else {
    console.log('Utilizando base de datos local JSON en:', jsonDbFile);
    await readJsonDb();
  }
}

// API de Base de Datos
async function getAllInvitaciones() {
  if (DATABASE_TYPE === 'mongodb' && InvitationModel) {
    const invites = await InvitationModel.find().lean();
    for (let invite of invites) {
      invite.asistentes = await AssistentModel.find({ invitacion_id: invite.id }).lean();
    }
    return invites;
  } else {
    const db = await readJsonDb();
    const result = [];
    for (let invite of db.invitaciones) {
      const copy = { ...invite };
      copy.asistentes = db.asistentes.filter(a => a.invitacion_id === invite.id);
      result.push(copy);
    }
    return result;
  }
}

async function getInvitacionById(id) {
  if (DATABASE_TYPE === 'mongodb' && InvitationModel) {
    const invite = await InvitationModel.findOne({ id }).lean();
    if (!invite) return null;
    invite.asistentes = await AssistentModel.find({ invitacion_id: id }).lean();
    return invite;
  } else {
    const db = await readJsonDb();
    const invite = db.invitaciones.find(i => i.id === id);
    if (!invite) return null;
    const copy = { ...invite };
    copy.asistentes = db.asistentes.filter(a => a.invitacion_id === id);
    return copy;
  }
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
    tipo_asistente: a.tipo_asistente || 'adulto',
    restriccion_alimentaria: a.restriccion_alimentaria || 'ninguna',
    restriccion_alimentaria_detalle: a.restriccion_alimentaria_detalle || '',
    mesa: ''
  }));

  if (DATABASE_TYPE === 'mongodb' && InvitationModel) {
    const createdInvite = await InvitationModel.create(newInvitation);
    const createdAsistentes = await AssistentModel.insertMany(newAsistentes);
    const result = createdInvite.toObject();
    result.asistentes = createdAsistentes.map(a => a.toObject());
    return result;
  } else {
    const db = await readJsonDb();
    db.invitaciones.push(newInvitation);
    db.asistentes.push(...newAsistentes);
    await writeJsonDb(db);
    const result = { ...newInvitation };
    result.asistentes = newAsistentes;
    return result;
  }
}

async function getInvitacionByDni(dni) {
  if (DATABASE_TYPE === 'mongodb' && InvitationModel) {
    const invite = await InvitationModel.findOne({ dni }).lean();
    if (!invite) return null;
    invite.asistentes = await AssistentModel.find({ invitacion_id: invite.id }).lean();
    return invite;
  } else {
    const db = await readJsonDb();
    const invite = db.invitaciones.find(i => i.dni === dni);
    if (!invite) return null;
    const copy = { ...invite };
    copy.asistentes = db.asistentes.filter(a => a.invitacion_id === invite.id);
    return copy;
  }
}

async function updateInvitacion(id, invitacionData, asistentesData) {
  const now = new Date();
  
  const updatedInvitation = {
    nombre: invitacionData.nombre,
    apellido: invitacionData.apellido,
    telefono: invitacionData.telefono,
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
    tipo_asistente: a.tipo_asistente || 'adulto',
    restriccion_alimentaria: a.restriccion_alimentaria || 'ninguna',
    restriccion_alimentaria_detalle: a.restriccion_alimentaria_detalle || '',
    mesa: a.mesa || ''
  }));

  if (DATABASE_TYPE === 'mongodb' && InvitationModel) {
    const updated = await InvitationModel.findOneAndUpdate({ id }, updatedInvitation, { new: true }).lean();
    await AssistentModel.deleteMany({ invitacion_id: id });
    const insertedAsistentes = await AssistentModel.insertMany(updatedAsistentes);
    const result = { ...updated };
    result.asistentes = insertedAsistentes.map(a => a.toObject());
    return result;
  } else {
    const db = await readJsonDb();
    const index = db.invitaciones.findIndex(i => i.id === id);
    if (index === -1) return null;

    db.invitaciones[index] = {
      ...db.invitaciones[index],
      ...updatedInvitation
    };

    db.asistentes = db.asistentes.filter(a => a.invitacion_id !== id);
    db.asistentes.push(...updatedAsistentes);
    await writeJsonDb(db);

    const result = { ...db.invitaciones[index] };
    result.asistentes = updatedAsistentes;
    return result;
  }
}

async function updateInvitacionStatus(id, estado_pago, estado_asistencia) {
  if (DATABASE_TYPE === 'mongodb' && InvitationModel) {
    const updates = { fecha_actualizacion: new Date() };
    if (estado_pago) updates.estado_pago = estado_pago;
    if (estado_asistencia) updates.estado_asistencia = estado_asistencia;

    const updated = await InvitationModel.findOneAndUpdate({ id }, updates, { new: true }).lean();
    if (updated) {
      updated.asistentes = await AssistentModel.find({ invitacion_id: id }).lean();
    }
    return updated;
  } else {
    const db = await readJsonDb();
    const index = db.invitaciones.findIndex(i => i.id === id);
    if (index === -1) return null;

    if (estado_pago) db.invitaciones[index].estado_pago = estado_pago;
    if (estado_asistencia) db.invitaciones[index].estado_asistencia = estado_asistencia;
    db.invitaciones[index].fecha_actualizacion = new Date();

    await writeJsonDb(db);
    const copy = { ...db.invitaciones[index] };
    copy.asistentes = db.asistentes.filter(a => a.invitacion_id === id);
    return copy;
  }
}

async function addComprobante(id, comprobanteData) {
  if (DATABASE_TYPE === 'mongodb' && InvitationModel) {
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
  } else {
    const db = await readJsonDb();
    const index = db.invitaciones.findIndex(i => i.id === id);
    if (index === -1) return null;

    db.invitaciones[index].estado_pago = 'a_verificar';
    db.invitaciones[index].comprobante = {
      archivo: comprobanteData.archivo,
      tipo_archivo: comprobanteData.tipo_archivo,
      fecha_carga: new Date()
    };
    db.invitaciones[index].fecha_actualizacion = new Date();

    await writeJsonDb(db);
    const copy = { ...db.invitaciones[index] };
    copy.asistentes = db.asistentes.filter(a => a.invitacion_id === id);
    return copy;
  }
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
    // Solo sumamos asistentes si la asistencia está confirmada
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

module.exports = {
  init,
  getAllInvitaciones,
  getInvitacionById,
  getInvitacionByDni,
  createInvitacion,
  updateInvitacion,
  updateInvitacionStatus,
  addComprobante,
  getStats
};
