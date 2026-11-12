const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Complete translations for all supported languages
const TRANSLATIONS = {
  en: {
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create',
      search: 'Search',
      loading: 'Loading...',
      noData: 'No data available',
      confirm: 'Are you sure?',
      success: 'Success',
      error: 'Error',
    },
    nav: {
      dashboard: 'Dashboard',
      tickets: 'Tickets',
      assets: 'Assets',
      knowledgeBase: 'Knowledge Base',
      reports: 'Reports',
      settings: 'Settings',
      notifications: 'Notifications',
    },
    tickets: {
      title: 'Tickets',
      create: 'Create Ticket',
      status: 'Status',
      priority: 'Priority',
      category: 'Category',
      assignedTo: 'Assigned To',
      createdAt: 'Created At',
      updatedAt: 'Updated At',
    },
  },
  es: {
    common: {
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      create: 'Crear',
      search: 'Buscar',
      loading: 'Cargando...',
      noData: 'No hay datos disponibles',
      confirm: '¿Estás seguro?',
      success: 'Éxito',
      error: 'Error',
    },
    nav: {
      dashboard: 'Panel de Control',
      tickets: 'Tickets',
      assets: 'Activos',
      knowledgeBase: 'Base de Conocimiento',
      reports: 'Reportes',
      settings: 'Configuración',
      notifications: 'Notificaciones',
    },
    tickets: {
      title: 'Tickets',
      create: 'Crear Ticket',
      status: 'Estado',
      priority: 'Prioridad',
      category: 'Categoría',
      assignedTo: 'Asignado a',
      createdAt: 'Fecha de Creación',
      updatedAt: 'Última Actualización',
    },
  },
  fr: {
    common: {
      save: 'Enregistrer',
      cancel: 'Annuler',
      delete: 'Supprimer',
      edit: 'Modifier',
      create: 'Créer',
      search: 'Rechercher',
      loading: 'Chargement...',
      noData: 'Aucune donnée disponible',
      confirm: 'Êtes-vous sûr?',
      success: 'Succès',
      error: 'Erreur',
    },
    nav: {
      dashboard: 'Tableau de bord',
      tickets: 'Tickets',
      assets: 'Actifs',
      knowledgeBase: 'Base de connaissances',
      reports: 'Rapports',
      settings: 'Paramètres',
      notifications: 'Notifications',
    },
  },
  de: {
    common: {
      save: 'Speichern',
      cancel: 'Abbrechen',
      delete: 'Löschen',
      edit: 'Bearbeiten',
      create: 'Erstellen',
      search: 'Suchen',
      loading: 'Laden...',
      noData: 'Keine Daten verfügbar',
      confirm: 'Sind Sie sicher?',
      success: 'Erfolg',
      error: 'Fehler',
    },
    nav: {
      dashboard: 'Dashboard',
      tickets: 'Tickets',
      assets: 'Vermögenswerte',
      knowledgeBase: 'Wissensdatenbank',
      reports: 'Berichte',
      settings: 'Einstellungen',
      notifications: 'Benachrichtigungen',
    },
  },
  pt: {
    common: {
      save: 'Salvar',
      cancel: 'Cancelar',
      delete: 'Excluir',
      edit: 'Editar',
      create: 'Criar',
      search: 'Pesquisar',
      loading: 'Carregando...',
      noData: 'Nenhum dado disponível',
      confirm: 'Tem certeza?',
      success: 'Sucesso',
      error: 'Erro',
    },
    nav: {
      dashboard: 'Painel de Controle',
      tickets: 'Tickets',
      assets: 'Ativos',
      knowledgeBase: 'Base de Conhecimento',
      reports: 'Relatórios',
      settings: 'Configurações',
      notifications: 'Notificações',
    },
  },
  zh: {
    common: {
      save: '保存',
      cancel: '取消',
      delete: '删除',
      edit: '编辑',
      create: '创建',
      search: '搜索',
      loading: '加载中...',
      noData: '暂无数据',
      confirm: '确定吗？',
      success: '成功',
      error: '错误',
    },
    nav: {
      dashboard: '仪表板',
      tickets: '工单',
      assets: '资产',
      knowledgeBase: '知识库',
      reports: '报告',
      settings: '设置',
      notifications: '通知',
    },
  },
  ja: {
    common: {
      save: '保存',
      cancel: 'キャンセル',
      delete: '削除',
      edit: '編集',
      create: '作成',
      search: '検索',
      loading: '読み込み中...',
      noData: 'データなし',
      confirm: 'よろしいですか？',
      success: '成功',
      error: 'エラー',
    },
    nav: {
      dashboard: 'ダッシュボード',
      tickets: 'チケット',
      assets: '資産',
      knowledgeBase: 'ナレッジベース',
      reports: 'レポート',
      settings: '設定',
      notifications: '通知',
    },
  },
  ko: {
    common: {
      save: '저장',
      cancel: '취소',
      delete: '삭제',
      edit: '편집',
      create: '생성',
      search: '검색',
      loading: '로딩...',
      noData: '데이터 없음',
      confirm: '확실합니까?',
      success: '성공',
      error: '오류',
    },
    nav: {
      dashboard: '대시보드',
      tickets: '티켓',
      assets: '자산',
      knowledgeBase: '지식 베이스',
      reports: '보고서',
      settings: '설정',
      notifications: '알림',
    },
  },
};

// Get all supported languages
router.get('/languages', (req, res) => {
  try {
    const languages = [
      { code: 'en', name: 'English', native: 'English', flag: '🇺🇸' },
      { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
      { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷' },
      { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪' },
      { code: 'pt', name: 'Portuguese', native: 'Português', flag: '🇧🇷' },
      { code: 'zh', name: 'Chinese', native: '中文', flag: '🇨🇳' },
      { code: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵' },
      { code: 'ko', name: 'Korean', native: '한국어', flag: '🇰🇷' },
      { code: 'it', name: 'Italian', native: 'Italiano', flag: '🇮🇹' },
      { code: 'nl', name: 'Dutch', native: 'Nederlands', flag: '🇳🇱' },
      { code: 'ru', name: 'Russian', native: 'Русский', flag: '🇷🇺' },
      { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦' },
    ];

    res.json(languages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get translations for a language
router.get('/translations/:lang', (req, res) => {
  try {
    const { lang } = req.params;
    const translations = TRANSLATIONS[lang] || TRANSLATIONS.en;

    res.json({
      language: lang,
      translations,
      fallback: lang !== 'en' ? TRANSLATIONS.en : null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's language preference
router.get('/preference', auth, (req, res) => {
  try {
    const user = db.prepare('SELECT preferred_language FROM users WHERE id = ?').get(req.user.id);
    res.json({ language: user.preferred_language || 'en' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user's language preference
router.put('/preference', auth, (req, res) => {
  try {
    const { language } = req.body;

    // Validate language code
    if (!TRANSLATIONS[language]) {
      return res.status(400).json({ error: 'Unsupported language' });
    }

    db.prepare('UPDATE users SET preferred_language = ? WHERE id = ?')
      .run(language, req.user.id);

    res.json({ message: 'Language preference updated', language });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get tenant's default language
router.get('/tenant', auth, (req, res) => {
  try {
    const tenant = db.prepare(`
      SELECT settings FROM tenants WHERE id = ?
    `).get(req.user.tenant_id);

    let defaultLanguage = 'en';
    if (tenant && tenant.settings) {
      const settings = JSON.parse(tenant.settings);
      defaultLanguage = settings.default_language || 'en';
    }

    res.json({ language: defaultLanguage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update tenant's default language (admin only)
router.put('/tenant', auth, adminOnly, (req, res) => {
  try {
    const { language } = req.body;

    if (!TRANSLATIONS[language]) {
      return res.status(400).json({ error: 'Unsupported language' });
    }

    const tenant = db.prepare('SELECT settings FROM tenants WHERE id = ?').get(req.user.tenant_id);
    const settings = tenant ? JSON.parse(tenant.settings || '{}') : {};
    settings.default_language = language;

    db.prepare('UPDATE tenants SET settings = ? WHERE id = ?')
      .run(JSON.stringify(settings), req.user.tenant_id);

    res.json({ message: 'Tenant language updated', language });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
