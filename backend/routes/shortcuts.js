const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

// Default keyboard shortcuts
const DEFAULT_SHORTCUTS = {
  global: [
    { key: 'ctrl+k', action: 'open_search', description: 'Open search' },
    { key: 'ctrl+n', action: 'new_ticket', description: 'Create new ticket' },
    { key: 'ctrl+d', action: 'go_dashboard', description: 'Go to dashboard' },
    { key: 'ctrl+t', action: 'go_tickets', description: 'Go to tickets' },
    { key: 'ctrl+a', action: 'go_assets', description: 'Go to assets' },
    { key: 'ctrl+/', action: 'show_shortcuts', description: 'Show keyboard shortcuts' },
    { key: 'escape', action: 'close_modal', description: 'Close modal/dialog' },
  ],
  tickets: [
    { key: 'r', action: 'reply', description: 'Reply to ticket' },
    { key: 'e', action: 'edit', description: 'Edit ticket' },
    { key: 'a', action: 'assign', description: 'Assign ticket' },
    { key: 'c', action: 'comment', description: 'Add comment' },
    { key: 's', action: 'change_status', description: 'Change status' },
    { key: 'p', action: 'change_priority', description: 'Change priority' },
    { key: 'j', action: 'next_ticket', description: 'Next ticket' },
    { key: 'k', action: 'prev_ticket', description: 'Previous ticket' },
    { key: '1', action: 'status_open', description: 'Set status: Open' },
    { key: '2', action: 'status_in_progress', description: 'Set status: In Progress' },
    { key: '3', action: 'status_resolved', description: 'Set status: Resolved' },
    { key: '4', action: 'status_closed', description: 'Set status: Closed' },
  ],
  assets: [
    { key: 'n', action: 'new_asset', description: 'Create new asset' },
    { key: 'e', action: 'edit', description: 'Edit asset' },
    { key: 'd', action: 'delete', description: 'Delete asset' },
    { key: 'j', action: 'next_asset', description: 'Next asset' },
    { key: 'k', action: 'prev_asset', description: 'Previous asset' },
  ],
  knowledge_base: [
    { key: 'n', action: 'new_article', description: 'Create new article' },
    { key: 'e', action: 'edit', description: 'Edit article' },
    { key: 'h', action: 'mark_helpful', description: 'Mark as helpful' },
  ],
};

// Get keyboard shortcuts
router.get('/', auth, (req, res) => {
  try {
    // Get user's custom shortcuts (if any)
    const userShortcuts = {};

    res.json({
      defaults: DEFAULT_SHORTCUTS,
      custom: userShortcuts,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get shortcuts for specific context
router.get('/:context', auth, (req, res) => {
  try {
    const context = req.params.context;
    const shortcuts = DEFAULT_SHORTCUTS[context] || DEFAULT_SHORTCUTS.global;

    res.json(shortcuts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
