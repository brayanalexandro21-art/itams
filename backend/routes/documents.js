const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth } = require('../middleware/auth');
const path = require('path');
const { createUpload, persistFile, removeFile, isRemote } = require('../storage');

// Uploads de documentos (Cloudinary en la nube, uploads/documents en local)
const upload = createUpload({
  folder: 'documents',
  prefix: 'doc_',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB (límite por archivo del plan gratis de Cloudinary)
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt|zip/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname || mimetype) {
      return cb(null, true);
    }
    cb(new Error('File type not allowed'));
  }
});

// Get all documents
router.get('/', auth, (req, res) => {
  try {
    const { entity_type, entity_id, category } = req.query;

    let query = `
      SELECT d.*, u.name as uploaded_by_name
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE 1=1
    `;

    const params = [];

    if (entity_type) {
      query += ' AND d.entity_type = ?';
      params.push(entity_type);
    }
    if (entity_id) {
      query += ' AND d.entity_id = ?';
      params.push(entity_id);
    }
    if (category) {
      query += ' AND d.category = ?';
      params.push(category);
    }

    query += ' ORDER BY d.created_at DESC';

    const documents = db.prepare(query).all(...params);
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload document
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { entity_type, entity_id, category, description } = req.body;
    const saved = await persistFile(req.file, 'documents', 'doc_');

    const result = db.prepare(`
      INSERT INTO documents (filename, original_name, mime_type, size, path, entity_type, entity_id, category, description, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      saved.filename,
      req.file.originalname,
      req.file.mimetype,
      req.file.size,
      saved.path,
      entity_type,
      entity_id,
      category,
      description,
      req.user.id
    );

    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(doc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download document
router.get('/:id/download', auth, (req, res) => {
  try {
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // En la nube el archivo está en Cloudinary: se redirige a su URL
    if (isRemote(doc.path)) return res.redirect(doc.path);
    res.download(doc.path, doc.original_name);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete document
router.delete('/:id', auth, async (req, res) => {
  try {
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Borrar el archivo (Cloudinary o disco local)
    await removeFile({ filename: doc.filename, path: doc.path });

    db.prepare('DELETE FROM documents WHERE id = ?').run(req.params.id);
    res.json({ message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get document stats
router.get('/stats', auth, (req, res) => {
  try {
    const stats = {
      total: db.prepare('SELECT COUNT(*) as count FROM documents').get().count,
      total_size: db.prepare('SELECT SUM(size) as total FROM documents').get().total || 0,
      by_category: db.prepare(`
        SELECT category, COUNT(*) as count, SUM(size) as total_size
        FROM documents
        GROUP BY category
      `).all(),
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
