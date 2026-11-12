const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Helper genérico CRUD
function createCrudRoutes(tableName, label) {
  // Listar
  router.get(`/${label}`, auth, (req, res) => {
    try {
      const items = db.prepare(`SELECT * FROM ${tableName} WHERE is_active = 1 ORDER BY name`).all();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Crear
  router.post(`/${label}`, auth, (req, res) => {
    try {
      const fields = Object.keys(req.body).filter(k => k !== 'id');
      const values = fields.map(k => req.body[k]);
      const placeholders = fields.map(() => '?').join(', ');
      const sql = `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
      const result = db.prepare(sql).run(...values);
      res.json({ id: result.lastInsertRowid, message: `${label} creado` });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Actualizar
  router.put(`/${label}/:id`, auth, adminOnly, (req, res) => {
    try {
      const fields = Object.keys(req.body).filter(k => k !== 'id');
      const sets = fields.map(k => `${k} = ?`).join(', ');
      const values = fields.map(k => req.body[k]);
      values.push(req.params.id);
      db.prepare(`UPDATE ${tableName} SET ${sets} WHERE id = ?`).run(...values);
      res.json({ message: `${label} actualizado` });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Eliminar (soft delete)
  router.delete(`/${label}/:id`, auth, adminOnly, (req, res) => {
    try {
      db.prepare(`UPDATE ${tableName} SET is_active = 0 WHERE id = ?`).run(req.params.id);
      res.json({ message: `${label} eliminado` });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

// Crear rutas CRUD para cada dropdown
createCrudRoutes('asset_statuses', 'statuses');
createCrudRoutes('asset_locations', 'locations');
createCrudRoutes('asset_types', 'types');
createCrudRoutes('asset_manufacturers', 'manufacturers');
createCrudRoutes('asset_models', 'models');
createCrudRoutes('asset_networks', 'networks');
createCrudRoutes('asset_update_sources', 'update-sources');

module.exports = router;