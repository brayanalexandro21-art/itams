const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Get all tags
router.get('/', auth, (req, res) => {
  try {
    const tags = db.prepare(`
      SELECT at.*, u.name as created_by_name,
        (SELECT COUNT(*) FROM asset_tag_assignments WHERE tag_id = at.id) as usage_count
      FROM asset_tags at
      LEFT JOIN users u ON at.created_by = u.id
      ORDER BY at.name
    `).all();

    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get tag by ID
router.get('/:id', auth, (req, res) => {
  try {
    const tag = db.prepare(`
      SELECT at.*, u.name as created_by_name
      FROM asset_tags at
      LEFT JOIN users u ON at.created_by = u.id
      WHERE at.id = ?
    `).get(req.params.id);

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    // Get assets with this tag
    const assets = db.prepare(`
      SELECT a.id, a.name, a.type, a.status
      FROM assets a
      JOIN asset_tag_assignments ata ON a.id = ata.asset_id
      WHERE ata.tag_id = ?
      ORDER BY a.name
    `).all(req.params.id);

    res.json({ ...tag, assets });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create tag
router.post('/', auth, adminOnly, (req, res) => {
  try {
    const { name, description, color } = req.body;

    // Check if name exists
    const existing = db.prepare('SELECT id FROM asset_tags WHERE name = ?').get(name);
    if (existing) {
      return res.status(400).json({ error: 'Tag name already exists' });
    }

    const result = db.prepare(`
      INSERT INTO asset_tags (name, description, color, created_by)
      VALUES (?, ?, ?, ?)
    `).run(name, description, color || '#6b7280', req.user.id);

    const tag = db.prepare('SELECT * FROM asset_tags WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(tag);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update tag
router.put('/:id', auth, adminOnly, (req, res) => {
  try {
    const { name, description, color } = req.body;

    db.prepare(`
      UPDATE asset_tags
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          color = COALESCE(?, color),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, description, color, req.params.id);

    const tag = db.prepare('SELECT * FROM asset_tags WHERE id = ?').get(req.params.id);
    res.json(tag);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete tag
router.delete('/:id', auth, adminOnly, (req, res) => {
  try {
    db.prepare('DELETE FROM asset_tag_assignments WHERE tag_id = ?').run(req.params.id);
    db.prepare('DELETE FROM asset_tags WHERE id = ?').run(req.params.id);
    res.json({ message: 'Tag deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign tag to asset
router.post('/assign', auth, adminOnly, (req, res) => {
  try {
    const { asset_id, tag_ids } = req.body;

    const insert = db.prepare('INSERT OR IGNORE INTO asset_tag_assignments (asset_id, tag_id) VALUES (?, ?)');
    tag_ids.forEach(tagId => {
      insert.run(asset_id, tagId);
    });

    res.json({ message: 'Tags assigned' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove tag from asset
router.delete('/assign/:assetId/:tagId', auth, adminOnly, (req, res) => {
  try {
    db.prepare('DELETE FROM asset_tag_assignments WHERE asset_id = ? AND tag_id = ?')
      .run(req.params.assetId, req.params.tagId);
    res.json({ message: 'Tag removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get tags for asset
router.get('/asset/:assetId', auth, (req, res) => {
  try {
    const tags = db.prepare(`
      SELECT at.*
      FROM asset_tags at
      JOIN asset_tag_assignments ata ON at.id = ata.tag_id
      WHERE ata.asset_id = ?
      ORDER BY at.name
    `).all(req.params.assetId);

    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get tag statistics
router.get('/stats/summary', auth, (req, res) => {
  try {
    const stats = {
      total_tags: db.prepare('SELECT COUNT(*) as count FROM asset_tags').get().count,
      total_assignments: db.prepare('SELECT COUNT(*) as count FROM asset_tag_assignments').get().count,
      most_used: db.prepare(`
        SELECT at.name, at.color, COUNT(ata.asset_id) as count
        FROM asset_tags at
        LEFT JOIN asset_tag_assignments ata ON at.id = ata.tag_id
        GROUP BY at.id
        ORDER BY count DESC
        LIMIT 10
      `).all(),
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
