const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Get all categories
router.get('/', auth, (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT kbc.*, u.name as created_by_name,
        (SELECT COUNT(*) FROM knowledge_base WHERE category = kbc.name) as article_count
      FROM kb_categories kbc
      LEFT JOIN users u ON kbc.created_by = u.id
      ORDER BY kbc.name
    `).all();

    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get category by ID
router.get('/:id', auth, (req, res) => {
  try {
    const category = db.prepare(`
      SELECT kbc.*, u.name as created_by_name
      FROM kb_categories kbc
      LEFT JOIN users u ON kbc.created_by = u.id
      WHERE kbc.id = ?
    `).get(req.params.id);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Get articles in category
    const articles = db.prepare(`
      SELECT kb.id, kb.title, kb.views, kb.helpful, kb.created_at
      FROM knowledge_base kb
      WHERE kb.category = ?
      ORDER BY kb.views DESC
      LIMIT 10
    `).all(category.name);

    res.json({ ...category, articles });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create category
router.post('/', auth, adminOnly, (req, res) => {
  try {
    const { name, description, icon, color, parent_id } = req.body;

    // Check if name exists
    const existing = db.prepare('SELECT id FROM kb_categories WHERE name = ?').get(name);
    if (existing) {
      return res.status(400).json({ error: 'Category name already exists' });
    }

    const result = db.prepare(`
      INSERT INTO kb_categories (name, description, icon, color, parent_id, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, description, icon || '📁', color || '#6b7280', parent_id, req.user.id);

    const category = db.prepare('SELECT * FROM kb_categories WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update category
router.put('/:id', auth, adminOnly, (req, res) => {
  try {
    const { name, description, icon, color, parent_id, active } = req.body;

    db.prepare(`
      UPDATE kb_categories
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          icon = COALESCE(?, icon),
          color = COALESCE(?, color),
          parent_id = COALESCE(?, parent_id),
          active = COALESCE(?, active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, description, icon, color, parent_id, active, req.params.id);

    const category = db.prepare('SELECT * FROM kb_categories WHERE id = ?').get(req.params.id);
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete category
router.delete('/:id', auth, adminOnly, (req, res) => {
  try {
    const category = db.prepare('SELECT name FROM kb_categories WHERE id = ?').get(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if category has articles
    const articles = db.prepare('SELECT COUNT(*) as count FROM knowledge_base WHERE category = ?').get(category.name).count;
    if (articles > 0) {
      return res.status(400).json({ error: 'Cannot delete category with articles' });
    }

    db.prepare('DELETE FROM kb_categories WHERE id = ?').run(req.params.id);
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get category tree (with subcategories)
router.get('/tree/list', auth, (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT kbc.*, 
        (SELECT COUNT(*) FROM knowledge_base WHERE category = kbc.name) as article_count
      FROM kb_categories kbc
      WHERE kbc.active = 1
      ORDER BY kbc.name
    `).all();

    // Build tree structure
    const tree = buildCategoryTree(categories);
    res.json(tree);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get category statistics
router.get('/stats/overview', auth, (req, res) => {
  try {
    const stats = {
      total_categories: db.prepare('SELECT COUNT(*) as count FROM kb_categories').get().count,
      active_categories: db.prepare("SELECT COUNT(*) as count FROM kb_categories WHERE active = 1").get().count,
      total_articles: db.prepare('SELECT COUNT(*) as count FROM knowledge_base').get().count,
      by_category: db.prepare(`
        SELECT category, COUNT(*) as count
        FROM knowledge_base
        WHERE category IS NOT NULL
        GROUP BY category
        ORDER BY count DESC
      `).all(),
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function buildCategoryTree(categories, parentId = null) {
  return categories
    .filter(cat => cat.parent_id === parentId)
    .map(cat => ({
      ...cat,
      children: buildCategoryTree(categories, cat.id),
    }));
}

module.exports = router;
