// Almacenamiento de archivos subidos (fotos de modelos, logos, documentos).
//
// - Si existe la variable CLOUDINARY_URL → los archivos se guardan en Cloudinary (nube, permanente).
// - Si no existe → se guardan en backend/uploads/ (modo local, para desarrollo en tu PC).
//
// En la nube (Render) el disco se borra en cada reinicio, por eso allí CLOUDINARY_URL es obligatorio.

require('./env'); // carga .env y limpia/valida CLOUDINARY_URL antes de usarla
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const USE_CLOUDINARY = !!process.env.CLOUDINARY_URL;
const UPLOADS_DIR = path.join(__dirname, 'uploads');

let cloudinary = null;
if (USE_CLOUDINARY) {
  // El SDK lee la configuración de CLOUDINARY_URL automáticamente
  cloudinary = require('cloudinary').v2;
}

function uniqueName(prefix, originalname) {
  const ext = path.extname(originalname || '').toLowerCase();
  return `${prefix}${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
}

/**
 * Crea un middleware de multer. En modo nube guarda en memoria (para enviarlo a Cloudinary);
 * en modo local guarda directamente en uploads/<folder>.
 */
function createUpload({ folder, prefix = '', limits, fileFilter }) {
  const storage = USE_CLOUDINARY
    ? multer.memoryStorage()
    : multer.diskStorage({
        destination: (req, file, cb) => {
          const dir = path.join(UPLOADS_DIR, folder);
          fs.mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (req, file, cb) => cb(null, uniqueName(prefix, file.originalname)),
      });
  return multer({ storage, limits, fileFilter });
}

/**
 * Guarda definitivamente un archivo recibido por multer.
 * Devuelve { url, filename, path }:
 *  - url: dirección pública para mostrar o descargar el archivo
 *  - filename: en Cloudinary es el public_id (sirve para borrarlo)
 *  - path: ruta local o URL de Cloudinary (se guarda en la BD)
 */
async function persistFile(file, folder, prefix = '') {
  if (!USE_CLOUDINARY) {
    const relative = path.relative(UPLOADS_DIR, file.path).split(path.sep).join('/');
    return { url: `/uploads/${relative}`, filename: file.filename, path: file.path };
  }

  const publicId = uniqueName(prefix, '').replace(/\.$/, '');
  const result = await new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: `itams/${folder}`,
          public_id: publicId,
          resource_type: 'auto', // imágenes, PDF y otros archivos
          use_filename: false,
        },
        (error, res) => (error ? reject(error) : resolve(res))
      )
      .end(file.buffer);
  });

  return { url: result.secure_url, filename: result.public_id, path: result.secure_url };
}

/** Borra un archivo guardado con persistFile (no falla si ya no existe). */
async function removeFile({ filename, path: filePath }) {
  try {
    if (USE_CLOUDINARY && filePath && /^https?:\/\//.test(filePath)) {
      // No sabemos si Cloudinary lo guardó como image, video o raw: se intenta con cada tipo
      for (const resource_type of ['image', 'raw', 'video']) {
        const r = await cloudinary.uploader.destroy(filename, { resource_type });
        if (r.result === 'ok') return;
      }
      return;
    }
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (error) {
    console.error('Error borrando archivo:', error.message);
  }
}

const isRemote = (p) => typeof p === 'string' && /^https?:\/\//.test(p);

module.exports = { createUpload, persistFile, removeFile, isRemote, USE_CLOUDINARY };
