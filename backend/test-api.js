const http = require('http');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://127.0.0.1:${PORT}`;

// Helper para realizar peticiones POST
function post(url, data, isJson = true) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = isJson ? JSON.stringify(data) : data;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': isJson ? 'application/json' : 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: JSON.parse(body)
        });
      });
    });

    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
}

// Helper para realizar peticiones GET con token
function get(url, token = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'GET',
      headers: {}
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: JSON.parse(body)
          });
        } catch (err) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.end();
  });
}

async function runTests() {
  console.log('=== INICIANDO PRUEBAS DE INTEGRACIÓN DEL BACKEND ===');
  
  try {
    // 1. Probar Login de Administrador
    console.log('\n1. Probando Login con credenciales correctas...');
    const loginRes = await post(`${BASE_URL}/api/admin/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    if (loginRes.statusCode !== 200 || !loginRes.body.token) {
      throw new Error(`Fallo en login. Status: ${loginRes.statusCode}, Body: ${JSON.stringify(loginRes.body)}`);
    }
    const token = loginRes.body.token;
    console.log('✓ Login exitoso. Token recibido.');

    // 2. Probar crear RSVP (Pagar después)
    console.log('\n2. Probando registro de RSVP con pago posterior...');
    const testDni = 'test_' + Math.floor(Math.random() * 100000000);
    const mockRsvp = {
      dni: testDni,
      nombre: 'Prueba',
      apellido: 'Automatizada',
      telefono: '+5491199998888',
      email: 'prueba@correo.com',
      cantidad_personas: 2,
      modalidad_pago: 'despues',
      importe_total: 75000,
      observaciones: 'Prueba de integración sin archivos',
      asistentes: [
        { nombre: 'Prueba Uno', apellido: 'Automatizada', email: 'uno@correo.com', tipo_asistente: 'adulto', restriccion_alimentaria: 'ninguna' },
        { nombre: 'Prueba Dos', apellido: 'Automatizada', tipo_asistente: 'menor', restriccion_alimentaria: 'celiaquia' }
      ]
    };

    const rsvpRes = await post(`${BASE_URL}/api/rsvp`, mockRsvp);
    if (rsvpRes.statusCode !== 201 || !rsvpRes.body.success) {
      throw new Error(`Fallo al registrar RSVP. Status: ${rsvpRes.statusCode}, Body: ${JSON.stringify(rsvpRes.body)}`);
    }
    console.log('✓ RSVP registrado con éxito.');
    console.log('Mensaje recibido:', rsvpRes.body.message);
    const createdRsvpId = rsvpRes.body.data.id;

    // 2.1 Probar consulta de registro por DNI
    console.log('\n2.1. Probando consulta de registro por DNI...');
    const verifyDniRes = await get(`${BASE_URL}/api/rsvp/verify/${testDni}`);
    if (verifyDniRes.statusCode !== 200 || verifyDniRes.body.dni !== testDni) {
      throw new Error(`Fallo al consultar por DNI. Status: ${verifyDniRes.statusCode}, Body: ${JSON.stringify(verifyDniRes.body)}`);
    }
    console.log('✓ Consulta por DNI exitosa. Datos correctos recuperados.');

    // 2.2 Probar actualización de registro por DNI (sobreescribir)
    console.log('\n2.2. Probando actualización de registro por DNI (sobreescribir)...');
    const updateRsvp = {
      ...mockRsvp,
      telefono: '+5491199998889',
      asistentes: [
        { ...mockRsvp.asistentes[0], nombre: 'Prueba Uno Modificado' },
        { ...mockRsvp.asistentes[1] }
      ]
    };
    const updateRes = await post(`${BASE_URL}/api/rsvp`, updateRsvp);
    if (updateRes.statusCode !== 201 || !updateRes.body.success) {
      throw new Error(`Fallo al actualizar RSVP. Status: ${updateRes.statusCode}, Body: ${JSON.stringify(updateRes.body)}`);
    }
    console.log('✓ RSVP actualizado con éxito.');

    // 3. Probar obtener Estadísticas
    console.log('\n3. Obteniendo estadísticas del evento...');
    const statsRes = await get(`${BASE_URL}/api/admin/stats`, token);
    if (statsRes.statusCode !== 200) {
      throw new Error(`Error al obtener estadísticas. Status: ${statsRes.statusCode}`);
    }
    console.log('✓ Estadísticas obtenidas:');
    console.log(JSON.stringify(statsRes.body, null, 2));

    // 4. Probar obtener todas las Invitaciones
    console.log('\n4. Obteniendo listado de confirmaciones...');
    const listRes = await get(`${BASE_URL}/api/admin/rsvps`, token);
    if (listRes.statusCode !== 200) {
      throw new Error(`Error al obtener invitaciones. Status: ${listRes.statusCode}`);
    }
    console.log(`✓ Se listaron ${listRes.body.length} invitaciones registradas.`);

    // 5. Probar verificar pago administrativamente
    console.log('\n5. Marcando pago como verificado...');
    const verifyRes = await post(`${BASE_URL}/api/admin/rsvps/${createdRsvpId}/verify`, {
      estado_pago: 'verificado'
    });
    // Nota: necesitamos agregar el token a la verificación. La función helper 'post' de arriba no admite token, hagámosla manualmente aquí
    const urlObj = new URL(`${BASE_URL}/api/admin/rsvps/${createdRsvpId}/verify`);
    const verifyData = JSON.stringify({ estado_pago: 'verificado' });
    
    const verifyPromise = new Promise((resolve, reject) => {
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Length': Buffer.byteLength(verifyData)
        }
      };
      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, body: JSON.parse(body) }));
      });
      req.on('error', e => reject(e));
      req.write(verifyData);
      req.end();
    });

    const verifyResult = await verifyPromise;
    if (verifyResult.statusCode !== 200 || !verifyResult.body.success) {
      throw new Error(`Error al verificar pago. Status: ${verifyResult.statusCode}, Body: ${JSON.stringify(verifyResult.body)}`);
    }
    console.log('✓ Pago verificado administrativamente.');

    // 6. Volver a comprobar Estadísticas
    console.log('\n6. Comprobando actualización de estadísticas post-verificación...');
    const newStatsRes = await get(`${BASE_URL}/api/admin/stats`, token);
    console.log('Estadísticas actualizadas:');
    console.log(JSON.stringify(newStatsRes.body, null, 2));
    
    const expectedRecaudacion = statsRes.body.recaudacion + 75000;
    if (newStatsRes.body.pagosVerificados !== statsRes.body.pagosVerificados + 1 || newStatsRes.body.recaudacion !== expectedRecaudacion) {
      throw new Error('Las estadísticas no se actualizaron correctamente al verificar el pago.');
    }
    console.log('✓ Las estadísticas se actualizaron perfectamente.');

    console.log('\n=== ¡TODAS LAS PRUEBAS DE INTEGRACIÓN PASARON EXITOSAMENTE! ===');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ ERROR EN LAS PRUEBAS:', err.message);
    process.exit(1);
  }
}

// Iniciar pruebas
runTests();
