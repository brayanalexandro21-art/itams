// Migraciones de esquema que se aplican al arrancar (local y Turso).
//
// Muchas rutas se escribieron usando nombres de columna distintos para el mismo dato
// (p. ej. "is_read" vs "read", "order_number" vs "po_number"). Para no duplicar datos:
//  - ALIAS: columnas generadas VIRTUAL que leen la columna original (solo lectura).
//  - EXTRA: columnas que realmente faltaban (lectura y escritura).
// Cada cambio solo se aplica si la columna todavía no existe, así que es seguro repetirlo.

const EXTRA = [
  ['users', 'status', "TEXT DEFAULT 'active'"],
  ['tickets', 'sla_met', 'INTEGER'],
  ['api_keys', 'updated_at', 'DATETIME'],
  ['api_request_logs', 'api_key_id', 'INTEGER'],
  ['assets', 'last_maintenance', 'DATETIME'],
  ['asset_maintenance', 'type', 'TEXT'],
  ['asset_maintenance', 'scheduled_date', 'DATETIME'],
  ['asset_maintenance', 'assigned_to', 'INTEGER'],
  ['asset_maintenance', 'created_by', 'INTEGER'],
  ['asset_scan_logs', 'scanned_by', 'INTEGER'],
  ['asset_scan_logs', 'scanned_at', 'DATETIME'],
  ['calendar_events', 'user_id', 'INTEGER'],
  ['calendar_events', 'all_day', 'INTEGER DEFAULT 0'],
  ['calendar_events', 'color', 'TEXT'],
  ['calendar_events', 'reminder', 'INTEGER'],
  ['custom_fields', 'created_by', 'INTEGER'],
  ['custom_field_values', 'created_by', 'INTEGER'],
  ['custom_reports', 'type', 'TEXT'],
  ['custom_reports', 'config', 'TEXT'],
  ['dashboard_layouts', 'name', 'TEXT'],
  ['dashboard_layouts', 'layout_config', 'TEXT'],
  ['dashboard_layouts', 'is_default', 'INTEGER DEFAULT 0'],
  ['dashboard_widgets', 'position_x', 'INTEGER DEFAULT 0'],
  ['dashboard_widgets', 'position_y', 'INTEGER DEFAULT 0'],
  ['dashboard_widgets', 'width', 'INTEGER DEFAULT 4'],
  ['dashboard_widgets', 'height', 'INTEGER DEFAULT 3'],
  ['dashboard_widgets', 'sort_order', 'INTEGER DEFAULT 0'],
  ['audit_logs', 'details', 'TEXT'],
  ['gamification_history', 'created_by', 'INTEGER'],
  ['integration_logs', 'executed_at', 'DATETIME'],
  ['knowledge_base', 'rating', 'REAL'],
  ['notification_channels', 'events', 'TEXT'],
  ['user_onboarding', 'current_step', 'INTEGER DEFAULT 0'],
  ['user_onboarding', 'completed_steps', "TEXT DEFAULT '[]'"],
  ['user_onboarding', 'completed', 'INTEGER DEFAULT 0'],
  ['rate_limits', 'user_id', 'INTEGER'],
  ['roles', 'is_system', 'INTEGER DEFAULT 0'],
  ['saved_searches', 'query', 'TEXT'],
  ['vendors', 'notes', 'TEXT'],
  ['integrations', 'user_id', 'INTEGER'],
  ['webhooks', 'method', "TEXT DEFAULT 'POST'"],
  ['webhook_logs', 'response_code', 'INTEGER'],
  ['workflows', 'created_by', 'INTEGER'],
];

// [tabla, alias, expresión sobre la columna original]
const ALIAS = [
  ['api_request_logs', 'response_time', 'response_time_ms'],
  ['calendar_events', 'start_date', 'start_time'],
  ['calendar_events', 'end_date', 'end_time'],
  ['ticket_comments', 'content', 'comment'],
  ['compliance_items', 'title', 'name'],
  ['compliance_history', 'status', 'action'],
  ['compliance_history', 'changed_by', 'performed_by'],
  ['custom_fields', 'sort_order', 'position'],
  ['assets', 'value', 'purchase_cost'],
  ['gamification_history', 'points', 'points_earned'],
  ['gamification_badges', 'points_required', 'points'],
  ['notifications', 'is_read', 'read'],
  ['notification_channels', 'channel_type', 'type'],
  ['purchase_orders', 'order_number', 'po_number'],
  ['purchase_orders', 'expected_date', 'expected_delivery'],
  ['purchase_order_items', 'order_id', 'purchase_order_id'],
  ['user_sessions', 'is_active', 'active'],
  ['user_sessions', 'expires_at', "datetime(COALESCE(last_active, created_at), '+1 day')"],
  ['slas', 'response_time_hours', 'response_time / 60.0'],
  ['slas', 'resolution_time_hours', 'resolution_time / 60.0'],
  ['ticket_templates', 'category', 'template_category'],
  ['ticket_templates', 'priority', 'template_priority'],
  ['ticket_templates', 'custom_fields', 'fields'],
  ['login_attempts', 'timestamp', 'created_at'],
  ['vendor_ratings', 'quality', 'quality_rating'],
  ['vendor_ratings', 'delivery', 'delivery_rating'],
  ['vendor_ratings', 'price', 'price_rating'],
  ['vendor_ratings', 'comments', 'comment'],
  ['vendor_ratings', 'rated_by', 'user_id'],
  ['webhook_logs', 'executed_at', 'created_at'],
  ['workflows', 'trigger_type', 'trigger_event'],
];

// SLA cumplido: se calcula al resolver/cerrar el ticket, comparando con el SLA del ticket
// (o, si no tiene, el SLA activo de su prioridad). resolution_time está en minutos.
const SLA_SUBQUERY = (t) => {
  const met = `CASE WHEN (julianday(COALESCE(${t}.resolved_at, CURRENT_TIMESTAMP)) - julianday(${t}.created_at)) * 1440
                    <= s.resolution_time THEN 1 ELSE 0 END`;
  return `COALESCE(
    (SELECT ${met} FROM slas s WHERE s.id = ${t}.sla_id),
    (SELECT ${met} FROM slas s WHERE s.priority = ${t}.priority AND s.active = 1 LIMIT 1)
  )`;
};

const TRIGGERS = `
  CREATE TRIGGER IF NOT EXISTS trg_tickets_sla_met
  AFTER UPDATE OF status, resolved_at ON tickets
  WHEN NEW.status IN ('resolved', 'closed') AND NEW.sla_met IS NULL
  BEGIN
    UPDATE tickets
       SET resolved_at = COALESCE(resolved_at, CURRENT_TIMESTAMP),
           sla_met = (${SLA_SUBQUERY('NEW')})
     WHERE id = NEW.id;
  END;

  CREATE TRIGGER IF NOT EXISTS trg_asset_last_maintenance
  AFTER INSERT ON asset_maintenance
  BEGIN
    UPDATE assets
       SET last_maintenance = COALESCE(NEW.maintenance_date, NEW.created_at, CURRENT_TIMESTAMP)
     WHERE id = NEW.asset_id;
  END;
`;

function columnsOf(db, table) {
  // table_xinfo incluye también las columnas generadas
  return db.prepare(`PRAGMA table_xinfo("${table}")`).all().map((c) => c.name);
}

function applyMigrations(db) {
  const cache = {};
  const has = (t, c) => (cache[t] ||= columnsOf(db, t)).includes(c);
  const add = (t, c, def) => {
    if (!(cache[t] ||= columnsOf(db, t)).length) return; // la tabla no existe
    if (has(t, c)) return;
    db.exec(`ALTER TABLE "${t}" ADD COLUMN "${c}" ${def}`);
    cache[t].push(c);
  };

  for (const [t, c, def] of EXTRA) add(t, c, def);
  for (const [t, c, expr] of ALIAS) add(t, c, `GENERATED ALWAYS AS (${expr}) VIRTUAL`);

  db.exec(TRIGGERS);

  // Rellenar datos existentes (solo filas que aún no tienen valor)
  db.exec(`
    UPDATE tickets SET sla_met = (${SLA_SUBQUERY('tickets')})
     WHERE sla_met IS NULL AND status IN ('resolved', 'closed');
    UPDATE assets SET last_maintenance = (
      SELECT MAX(COALESCE(maintenance_date, created_at)) FROM asset_maintenance am WHERE am.asset_id = assets.id)
     WHERE last_maintenance IS NULL;
  `);
}

module.exports = { applyMigrations };
