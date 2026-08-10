const { Client } = require('ssh2');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colores para consola
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

const logOk = (msg) => console.log(`${GREEN}✔ ${msg}${RESET}`);
const logInfo = (msg) => console.log(`${YELLOW}→ ${msg}${RESET}`);
const logErr = (msg) => { console.error(`${RED}✘ ${msg}${RESET}`); process.exit(1); };

// Configuración
const SSH_HOST = "66.97.40.135";
const SSH_USER = "root";
const SSH_PASS = "2i_c3JyyyxQV/n";
const REMOTE_BACKEND = "/var/www/solrabozzi.com/backend";
const REMOTE_FRONTEND = "/var/www/solrabozzi.com/frontend";
const PM2_APP = "solrabozzi.com-backend";

console.log("╔═════════════════════════════════════════════════╗");
console.log("║     TECNE - solrabozzi.com  │  DEPLOY NODEJS    ║");
console.log("╚═════════════════════════════════════════════════╝\n");

// ─── 1. Crear archivos comprimidos localmente con tar de Windows ───
logInfo("Creando paquetes comprimidos locales...");
try {
  // Comprimir backend excluyendo node_modules, .env, logs y uploads
  execSync('tar -czf backend.tar.gz --exclude=node_modules --exclude=.env --exclude=logs --exclude=*.log --exclude=uploads -C ./backend .', { stdio: 'inherit' });
  logOk("backend.tar.gz creado con éxito.");

  // Comprimir frontend excluyendo node_modules y dist
  execSync('tar -czf frontend.tar.gz --exclude=node_modules --exclude=dist -C ./frontend .', { stdio: 'inherit' });
  logOk("frontend.tar.gz creado con éxito.");
} catch (err) {
  logErr(`Error al crear los archivos comprimidos localmente: ${err.message}`);
}

// ─── 2. Iniciar conexión SSH y SFTP ───
const conn = new Client();

conn.on('ready', () => {
  logOk("Conexión SSH establecida con éxito.");
  
  conn.sftp((err, sftp) => {
    if (err) logErr(`Error al iniciar SFTP: ${err.message}`);
    
    // Subir backend.tar.gz
    logInfo("Subiendo backend.tar.gz al servidor...");
    sftp.fastPut('backend.tar.gz', '/tmp/backend.tar.gz', {}, (uploadErr) => {
      if (uploadErr) logErr(`Error al subir backend.tar.gz: ${uploadErr.message}`);
      logOk("backend.tar.gz subido.");

      // Subir frontend.tar.gz
      logInfo("Subiendo frontend.tar.gz al servidor...");
      sftp.fastPut('frontend.tar.gz', '/tmp/frontend.tar.gz', {}, (upload2Err) => {
        if (upload2Err) logErr(`Error al subir frontend.tar.gz: ${upload2Err.message}`);
        logOk("frontend.tar.gz subido.");

        // Subir configuración de Nginx
        logInfo("Subiendo solrabozzi.com.nginx al servidor...");
        sftp.fastPut('solrabozzi.com.nginx', '/tmp/solrabozzi.com.nginx', {}, (upload3Err) => {
          if (upload3Err) logErr(`Error al subir solrabozzi.com.nginx: ${upload3Err.message}`);
          logOk("solrabozzi.com.nginx subido.");

          // Ejecutar comandos de despliegue remotos
          executeRemoteCommands();
        });
      });
    });
  });
}).on('error', (err) => {
  logErr(`Fallo en la conexión SSH: ${err.message}`);
}).connect({
  host: SSH_HOST,
  port: 22,
  username: SSH_USER,
  password: SSH_PASS
});

function executeRemoteCommands() {
  logInfo("Ejecutando tareas de despliegue en el servidor remoto...");

  const commands = [
    // Asegurar directorios
    `mkdir -p ${REMOTE_BACKEND}`,
    `mkdir -p ${REMOTE_FRONTEND}`,
    
    // Limpiar backend remoto preservando node_modules, .env, logs y uploads
    `find ${REMOTE_BACKEND} -mindepth 1 -maxdepth 1 ! -name '.env' ! -name 'node_modules' ! -name 'uploads' ! -name 'logs' -exec rm -rf {} +`,
    
    // Limpiar frontend remoto preservando node_modules
    `find ${REMOTE_FRONTEND} -mindepth 1 -maxdepth 1 ! -name 'node_modules' -exec rm -rf {} +`,

    // Extraer backend
    `tar -xzf /tmp/backend.tar.gz -C ${REMOTE_BACKEND}`,
    
    // Extraer frontend
    `tar -xzf /tmp/frontend.tar.gz -C ${REMOTE_FRONTEND}`,
    
    // Instalar dependencias backend
    `cd ${REMOTE_BACKEND} && npm install --omit=dev --silent`,

    // Instalar dependencias y build del frontend
    `cd ${REMOTE_FRONTEND} && npm install --silent && npm run build`,

    // Habilitar configuración Nginx. Si no tiene certificado SSL, crear bootstrap temporal y generar certificado mediante Certbot.
    `if [ ! -f /etc/letsencrypt/live/solrabozzi.com/fullchain.pem ]; then ` +
      `echo "server { listen 80; server_name solrabozzi.com www.solrabozzi.com; location /.well-known/acme-challenge/ { root /var/www/solrabozzi.com/frontend/dist; } location / { root /var/www/solrabozzi.com/frontend/dist; index index.html; try_files \\$uri \\$uri/ /index.html; } location /api { proxy_pass http://127.0.0.1:5000; proxy_http_version 1.1; proxy_set_header Upgrade \\$http_upgrade; proxy_set_header Connection 'upgrade'; proxy_set_header Host \\$host; } }" > /etc/nginx/sites-available/solrabozzi.com && ` +
      `ln -sf /etc/nginx/sites-available/solrabozzi.com /etc/nginx/sites-enabled/solrabozzi.com && ` +
      `systemctl reload nginx && ` +
      `certbot certonly --webroot -w /var/www/solrabozzi.com/frontend/dist -d solrabozzi.com -d www.solrabozzi.com --non-interactive --agree-tos --email root@tecne.com.ar; ` +
    `fi`,

    // Aplicar configuración de Nginx definitiva con SSL y recargar
    `mv /tmp/solrabozzi.com.nginx /etc/nginx/sites-available/solrabozzi.com`,
    `ln -sf /etc/nginx/sites-available/solrabozzi.com /etc/nginx/sites-enabled/solrabozzi.com`,
    `systemctl reload nginx`,

    // Reiniciar backend con PM2 (o iniciarlo por primera vez si no existe)
    `cd ${REMOTE_BACKEND} && (pm2 restart ${PM2_APP} --update-env || pm2 start server.js --name "${PM2_APP}")`,

    // Limpiar archivos en /tmp
    `rm -f /tmp/backend.tar.gz /tmp/frontend.tar.gz`,

    // Mostrar estado de PM2
    `pm2 show ${PM2_APP} | grep -E "status|restart|uptime|memory"`
  ];

  const fullCommand = commands.join(' && ');

  conn.exec(fullCommand, (err, stream) => {
    if (err) logErr(`Error al ejecutar comandos remotos: ${err.message}`);

    stream.on('close', (code, signal) => {
      // Cerrar conexión SSH
      conn.end();

      // Eliminar archivos comprimidos locales
      logInfo("Limpiando archivos temporales locales...");
      try {
        fs.unlinkSync('backend.tar.gz');
        fs.unlinkSync('frontend.tar.gz');
      } catch (cleanErr) {
        console.warn(`Advertencia al limpiar archivos locales: ${cleanErr.message}`);
      }

      if (code === 0) {
        logOk("Despliegue completado exitosamente.");
      } else {
        logErr(`El despliegue remoto falló con código de salida: ${code}`);
      }
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}
