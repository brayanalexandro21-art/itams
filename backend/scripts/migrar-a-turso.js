// Copia los datos de tu base local (backend/itams.db) a Turso, y las imágenes
// de backend/uploads a Cloudinary (si CLOUDINARY_URL está configurada).
//
// Uso (desde la carpeta backend, con TURSO_DATABASE_URL y TURSO_AUTH_TOKEN en .env):
//   npm run migrar-turso
//
// Es seguro ejecutarlo más de una vez: las tablas que ya tienen datos en Turso se omiten
// (usa --forzar para insertar igualmente; las filas con el mismo id se ignoran).

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });
const Database = require('libsql');

const FORZAR = process.argv.includes('--forzar');
const LOCAL_DB = path.join(__dirname, '..', 'itams.db');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  console.error('❌ Configura TURSO_DATABASE_URL y TURSO_AUTH_TOKEN en backend/.env antes de migrar.');
  process.exit(1);
}
if (!fs.existsSync(LOCAL_DB)) {
  console.error(`❌ No se encontró la base local: ${LOCAL_DB}`);
  process.exit(1);
}

// Réplica temporal propia del script, para no mezclarla con la del servidor
process.env.DB_REPLICA_PATH = path.join(__dirname, '..', 'itams-migracion-replica.db');

// Al cargar database.js con las variables de Turso se crean todas las tablas en la nube
const remote = require('../database');
const local = new Database(LOCAL_DB);

let cloudinary = null;
if (process.env.CLOUDINARY_URL) cloudinary = require('cloudinary').v2;

const uploadedCache = new Map();

// Sube un archivo de /uploads/... a Cloudinary y devuelve la nueva URL
async function migrarArchivo(valor) {
  if (!cloudinary) return valor;
  if (uploadedCache.has(valor)) return uploadedCache.get(valor);
  const rel = valor.replace(/^\/uploads\//, '');
  const local = path.join(UPLOADS_DIR, ...rel.split('/'));
  if (!fs.existsSync(local) || fs.statSync(local).size < 100) {
    console.warn(`   ⚠️  Archivo no encontrado o dañado, se deja igual: ${valor}`);
    uploadedCache.set(valor, valor);
    return valor;
  }
  const folder = `itams/${path.posix.dirname(rel) === '.' ? 'documents' : path.posix.dirname(rel)}`;
  const res = await cloudinary.uploader.upload(local, { folder, resource_type: 'auto' });
  uploadedCache.set(valor, res.secure_url);
  console.log(`   🖼️  ${valor} → Cloudinary`);
  return res.secure_url;
}

async function main() {
  const tablas = local
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    .all()
    .map((t) => t.name);

  console.log(`Tablas en la base local: ${tablas.length}\n`);
  let totalFilas = 0;

  for (const tabla of tablas) {
    const filas = local.prepare(`SELECT * FROM "${tabla}"`).all();
    if (filas.length === 0) continue;

    // Columnas que existen en ambos lados
    // Solo columnas reales (las generadas/alias, hidden != 0, no se pueden insertar)
    const colsRemotas = remote.prepare(`PRAGMA table_xinfo("${tabla}")`).all()
      .filter((c) => c.hidden === 0)
      .map((c) => c.name);
    if (colsRemotas.length === 0) {
      console.warn(`⚠️  ${tabla}: no existe en Turso, se omite`);
      continue;
    }
    const enRemoto = remote.prepare(`SELECT COUNT(*) AS c FROM "${tabla}"`).get().c;
    if (enRemoto > 0 && !FORZAR) {
      console.log(`⏭️  ${tabla}: ya tiene ${enRemoto} filas en Turso, se omite`);
      continue;
    }

    const cols = Object.keys(filas[0]).filter((c) => colsRemotas.includes(c));
    const insert = remote.prepare(
      `INSERT OR IGNORE INTO "${tabla}" (${cols.map((c) => `"${c}"`).join(', ')}) ` +
        `VALUES (${cols.map(() => '?').join(', ')})`
    );

    let n = 0;
    for (const fila of filas) {
      const valores = [];
      for (const c of cols) {
        let v = fila[c];
        // Rutas a archivos locales (/uploads/...) → se suben a Cloudinary
        // (también dentro de textos JSON, p. ej. listas de fotos)
        if (typeof v === 'string' && v.includes('/uploads/')) {
          const rutas = [...new Set(v.match(/\/uploads\/[^"'\s,\]\\]+/g) || [])];
          for (const r of rutas) v = v.split(r).join(await migrarArchivo(r));
        }
        valores.push(v);
      }
      insert.run(...valores);
      n++;
    }
    totalFilas += n;
    console.log(`✅ ${tabla}: ${n} filas`);
  }

  console.log(`\n🎉 Migración terminada: ${totalFilas} filas copiadas a Turso.`);
  if (!cloudinary) {
    console.log('ℹ️  CLOUDINARY_URL no estaba configurada: las imágenes no se subieron.');
  }
}

main()
  .catch((e) => {
    console.error('❌ Error en la migración:', e.message);
    process.exitCode = 1;
  })
  .finally(() => {
    try { fs.rmSync(process.env.DB_REPLICA_PATH, { force: true }); } catch {}
  });
