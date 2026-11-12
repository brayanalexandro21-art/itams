// Carga backend/.env y limpia las claves de la nube.
// Al copiarlas a un panel (Render) es fácil pegar espacios, comillas o la línea
// entera "NOMBRE=valor"; aquí se corrige eso y se avisa si el formato sigue mal.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });

const NUBE = ['TURSO_DATABASE_URL', 'TURSO_AUTH_TOKEN', 'CLOUDINARY_URL'];

for (const nombre of NUBE) {
  let v = process.env[nombre];
  if (typeof v !== 'string') continue;
  v = v.trim();
  if (v.startsWith(`${nombre}=`)) v = v.slice(nombre.length + 1).trim(); // pegaron "NOMBRE=valor"
  v = v.replace(/^(['"])(.*)\1$/, '$2').trim(); // comillas alrededor
  process.env[nombre] = v;
}

// Muestra solo el comienzo del valor (nunca la clave completa)
const inicio = (v) => JSON.stringify(v.slice(0, 9) + (v.length > 9 ? '…' : ''));

const { TURSO_DATABASE_URL: url, TURSO_AUTH_TOKEN: token, CLOUDINARY_URL: cloud } = process.env;
if (url && !/^(libsql|https?|wss?):\/\/\S+$/.test(url)) {
  throw new Error(
    `TURSO_DATABASE_URL no es válida: debe empezar por "libsql://" y empieza por ${inicio(url)}. ` +
      'Revisa el valor en el panel (Render → Environment) o en backend/.env.'
  );
}
if (url && !token) {
  throw new Error('Falta TURSO_AUTH_TOKEN (el token de la base de Turso).');
}
if (cloud && !/^cloudinary:\/\/\d+:[^@\s]+@\S+$/.test(cloud)) {
  throw new Error(
    `CLOUDINARY_URL no es válida: debe tener la forma cloudinary://API_KEY:API_SECRET@CLOUD_NAME y empieza por ${inicio(cloud)}.`
  );
}

module.exports = {};
