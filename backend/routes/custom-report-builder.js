const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Listar reportes personalizados
router.get('/', auth, (req, res) => {
  try {
    const reports = db.prepare('SELECT * FROM custom_reports WHERE created_by = ? ORDER BY created_at DESC').all(req.user.id);
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear reporte personalizado
router.post('/', auth, (req, res) => {
  try {
    const { name, description, config } = req.body;
    const result = db.prepare(`
      INSERT INTO custom_reports (template_id, name, description, type, config, created_by)
      VALUES ('custom', ?, ?, 'custom', ?, ?)
    `).run(name, description, JSON.stringify(config || {}), req.user.id);
    res.json({ id: result.lastInsertRowid, name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ejecutar reporte personalizado
router.post('/:id/run', auth, (req, res) => {
  try {
    const report = db.prepare('SELECT * FROM custom_reports WHERE id = ?').get(req.params.id);
    if (!report) return res.status(404).json({ error: 'Reporte no encontrado' });

    const config = JSON.parse(report.config || '{}');
    let data = {};

    switch (config.entity) {
      case 'tickets':
        let ticketQuery = 'SELECT ';
        const fields = config.fields || ['id', 'title', 'status', 'priority', 'created_at'];
        ticketQuery += fields.join(', ');
        ticketQuery += ' FROM tickets WHERE 1=1';
        const ticketParams = [];

        if (config.filters) {
          Object.entries(config.filters).forEach(([key, value]) => {
            if (value) { ticketQuery += ` AND ${key} = ?`; ticketParams.push(value); }
          });
        }
        if (config.sort) { ticketQuery += ` ORDER BY ${config.sort.field} ${config.sort.order || 'DESC'}`; }
        if (config.limit) { ticketQuery += ` LIMIT ?`; ticketParams.push(config.limit); }

        data = db.prepare(ticketQuery).all(...ticketParams);
        break;
      case 'assets':
        let assetQuery = `SELECT ${config.fields?.join(',') || '*'} FROM assets WHERE 1=1`;
        const assetParams = [];
        if (config.filters) {
          Object.entries(config.filters).forEach(([key, value]) => {
            if (value) { assetQuery += ` AND ${key} = ?`; assetParams.push(value); }
          });
        }
        data = db.prepare(assetQuery).all(...assetParams);
        break;
      case 'users':
        data = db.prepare(`SELECT ${config.fields?.join(',') || 'id, name, email, role'} FROM users`).all();
        break;
      case 'summary':
        data = {
          tickets: db.prepare('SELECT COUNT(*) as c FROM tickets').get().c,
          assets: db.prepare('SELECT COUNT(*) as c FROM assets').get().c,
          users: db.prepare('SELECT COUNT(*) as c FROM users').get().c,
          open_tickets: db.prepare("SELECT COUNT(*) as c FROM tickets WHERE status='open'").get().c,
        };
        break;
    }

    res.json({ report: report.name, data, count: Array.isArray(data) ? data.length : 1 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar reporte
router.delete('/:id', auth, (req, res) => {
  try {
    db.prepare('DELETE FROM custom_reports WHERE id = ? AND created_by = ?').run(req.params.id, req.user.id);
    res.json({ message: 'Reporte eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Plantillas predefinidas
router.get('/templates', auth, (req, res) => {
  res.json([
    { name: 'Tickets abiertos por prioridad', entity: 'tickets', fields: ['id', 'title', 'priority', 'created_at'], filters: { status: 'open' }, sort: { field: 'priority', order: 'ASC' } },
    { name: 'Activos por tipo', entity: 'assets', fields: ['id', 'name', 'type', 'status'], sort: { field: 'type' } },
    { name: 'Resumen general', entity: 'summary', fields: [] },
    { name: 'Usuarios por rol', entity: 'users', fields: ['id', 'name', 'email', 'role'], sort: { field: 'role' } },
  ]);
});

module.exports = router;