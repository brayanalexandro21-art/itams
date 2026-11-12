const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth } = require('../middleware/auth');

// Get article versions
router.get('/:articleId/versions', auth, (req, res) => {
  try {
    const versions = db.prepare(`
      SELECT kbv.*, u.name as edited_by_name
      FROM knowledge_base_versions kbv
      LEFT JOIN users u ON kbv.edited_by = u.id
      WHERE kbv.article_id = ?
      ORDER BY kbv.version DESC
    `).all(req.params.articleId);

    res.json(versions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific version
router.get('/:articleId/versions/:version', auth, (req, res) => {
  try {
    const version = db.prepare(`
      SELECT kbv.*, u.name as edited_by_name
      FROM knowledge_base_versions kbv
      LEFT JOIN users u ON kbv.edited_by = u.id
      WHERE kbv.article_id = ? AND kbv.version = ?
    `).get(req.params.articleId, req.params.version);

    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }

    res.json(version);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new version
router.post('/:articleId/versions', auth, (req, res) => {
  try {
    const { title, content, change_summary } = req.body;

    // Get current version number
    const currentVersion = db.prepare(`
      SELECT MAX(version) as max_version
      FROM knowledge_base_versions
      WHERE article_id = ?
    `).get(req.params.articleId);

    const newVersion = (currentVersion.max_version || 0) + 1;

    // Save version
    const result = db.prepare(`
      INSERT INTO knowledge_base_versions (article_id, version, title, content, change_summary, edited_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.params.articleId, newVersion, title, content, change_summary, req.user.id);

    // Update article with new version
    db.prepare(`
      UPDATE knowledge_base
      SET title = ?, content = ?, current_version = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title, content, newVersion, req.params.articleId);

    res.status(201).json({ version: newVersion, id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Compare versions
router.get('/:articleId/compare', auth, (req, res) => {
  try {
    const { v1, v2 } = req.query;

    const version1 = db.prepare(`
      SELECT * FROM knowledge_base_versions
      WHERE article_id = ? AND version = ?
    `).get(req.params.articleId, v1);

    const version2 = db.prepare(`
      SELECT * FROM knowledge_base_versions
      WHERE article_id = ? AND version = ?
    `).get(req.params.articleId, v2);

    if (!version1 || !version2) {
      return res.status(404).json({ error: 'Version(s) not found' });
    }

    // Simple diff - in production, use a proper diff library
    const changes = {
      title_changed: version1.title !== version2.title,
      content_changed: version1.content !== version2.content,
      old_title: version1.title,
      new_title: version2.title,
      content_diff: generateSimpleDiff(version1.content, version2.content),
    };

    res.json(changes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Revert to version
router.post('/:articleId/revert/:version', auth, (req, res) => {
  try {
    const version = db.prepare(`
      SELECT * FROM knowledge_base_versions
      WHERE article_id = ? AND version = ?
    `).get(req.params.articleId, req.params.version);

    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }

    // Create new version with old content
    const currentVersion = db.prepare(`
      SELECT MAX(version) as max_version
      FROM knowledge_base_versions
      WHERE article_id = ?
    `).get(req.params.articleId);

    const newVersion = (currentVersion.max_version || 0) + 1;

    db.prepare(`
      INSERT INTO knowledge_base_versions (article_id, version, title, content, change_summary, edited_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      req.params.articleId,
      newVersion,
      version.title,
      version.content,
      `Reverted to version ${req.params.version}`,
      req.user.id
    );

    // Update article
    db.prepare(`
      UPDATE knowledge_base
      SET title = ?, content = ?, current_version = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(version.title, version.content, newVersion, req.params.articleId);

    res.json({ message: 'Reverted successfully', new_version: newVersion });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function generateSimpleDiff(oldText, newText) {
  // Simple line-by-line diff
  const oldLines = (oldText || '').split('\n');
  const newLines = (newText || '').split('\n');

  const diff = [];
  const maxLines = Math.max(oldLines.length, newLines.length);

  for (let i = 0; i < maxLines; i++) {
    if (oldLines[i] !== newLines[i]) {
      diff.push({
        line: i + 1,
        old: oldLines[i] || null,
        new: newLines[i] || null,
      });
    }
  }

  return diff;
}

module.exports = router;
