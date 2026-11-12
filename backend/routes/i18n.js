const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth } = require('../middleware/auth');

// Available languages
const languages = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
  { code: 'it', name: 'Italian', native: 'Italiano' },
  { code: 'nl', name: 'Dutch', native: 'Nederlands' },
  { code: 'zh', name: 'Chinese', native: '中文' },
  { code: 'ja', name: 'Japanese', native: '日本語' },
  { code: 'ko', name: 'Korean', native: '한국어' },
];

// Sample translations (in production, use a proper i18n library)
const translations = {
  en: {
    'dashboard': 'Dashboard',
    'tickets': 'Tickets',
    'assets': 'Assets',
    'knowledge_base': 'Knowledge Base',
    'settings': 'Settings',
    'reports': 'Reports',
    'notifications': 'Notifications',
    'profile': 'Profile',
    'logout': 'Logout',
    'search': 'Search',
    'create': 'Create',
    'edit': 'Edit',
    'delete': 'Delete',
    'save': 'Save',
    'cancel': 'Cancel',
    'submit': 'Submit',
    'loading': 'Loading...',
    'no_data': 'No data available',
    'welcome': 'Welcome',
    'ticket_created': 'Ticket created successfully',
    'ticket_updated': 'Ticket updated successfully',
    'ticket_deleted': 'Ticket deleted successfully',
    'asset_created': 'Asset created successfully',
    'asset_updated': 'Asset updated successfully',
    'asset_deleted': 'Asset deleted successfully',
    'open': 'Open',
    'in_progress': 'In Progress',
    'resolved': 'Resolved',
    'closed': 'Closed',
    'low': 'Low',
    'medium': 'Medium',
    'high': 'High',
    'urgent': 'Urgent',
  },
  es: {
    'dashboard': 'Panel de Control',
    'tickets': 'Tickets',
    'assets': 'Activos',
    'knowledge_base': 'Base de Conocimiento',
    'settings': 'Configuración',
    'reports': 'Reportes',
    'notifications': 'Notificaciones',
    'profile': 'Perfil',
    'logout': 'Cerrar Sesión',
    'search': 'Buscar',
    'create': 'Crear',
    'edit': 'Editar',
    'delete': 'Eliminar',
    'save': 'Guardar',
    'cancel': 'Cancelar',
    'submit': 'Enviar',
    'loading': 'Cargando...',
    'no_data': 'No hay datos disponibles',
    'welcome': 'Bienvenido',
    'ticket_created': 'Ticket creado exitosamente',
    'ticket_updated': 'Ticket actualizado exitosamente',
    'ticket_deleted': 'Ticket eliminado exitosamente',
    'asset_created': 'Activo creado exitosamente',
    'asset_updated': 'Activo actualizado exitosamente',
    'asset_deleted': 'Activo eliminado exitosamente',
    'open': 'Abierto',
    'in_progress': 'En Progreso',
    'resolved': 'Resuelto',
    'closed': 'Cerrado',
    'low': 'Baja',
    'medium': 'Media',
    'high': 'Alta',
    'urgent': 'Urgente',
  },
  pt: {
    'dashboard': 'Painel de Controle',
    'tickets': 'Tickets',
    'assets': 'Ativos',
    'knowledge_base': 'Base de Conhecimento',
    'settings': 'Configurações',
    'reports': 'Relatórios',
    'notifications': 'Notificações',
    'profile': 'Perfil',
    'logout': 'Sair',
    'search': 'Pesquisar',
    'create': 'Criar',
    'edit': 'Editar',
    'delete': 'Excluir',
    'save': 'Salvar',
    'cancel': 'Cancelar',
    'submit': 'Enviar',
    'loading': 'Carregando...',
    'no_data': 'Sem dados disponíveis',
    'welcome': 'Bem-vindo',
    'ticket_created': 'Ticket criado com sucesso',
    'ticket_updated': 'Ticket atualizado com sucesso',
    'ticket_deleted': 'Ticket excluído com sucesso',
    'asset_created': 'Ativo criado com sucesso',
    'asset_updated': 'Ativo atualizado com sucesso',
    'asset_deleted': 'Ativo excluído com sucesso',
    'open': 'Aberto',
    'in_progress': 'Em Andamento',
    'resolved': 'Resolvido',
    'closed': 'Fechado',
    'low': 'Baixa',
    'medium': 'Média',
    'high': 'Alta',
    'urgent': 'Urgente',
  },
};

// Get available languages
router.get('/languages', (req, res) => {
  res.json(languages);
});

// Get translations for a language
router.get('/translations/:lang', (req, res) => {
  try {
    const lang = req.params.lang;
    const translationData = translations[lang] || translations.en;
    res.json(translationData);
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
    db.prepare('UPDATE users SET preferred_language = ? WHERE id = ?').run(language, req.user.id);
    res.json({ message: 'Language preference updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
