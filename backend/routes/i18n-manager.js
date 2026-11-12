const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Obtener traducciones
router.get('/:lang', auth, (req, res) => {
  try {
    const lang = req.params.lang;
    const translations = {
      es: {
        dashboard: 'Panel', tickets: 'Tickets', assets: 'Activos', knowledge_base: 'Base de Conocimiento',
        reports: 'Reportes', settings: 'Configuración', notifications: 'Notificaciones',
        search: 'Búsqueda', users: 'Usuarios', workflows: 'Workflows',
        create: 'Crear', edit: 'Editar', delete: 'Eliminar', save: 'Guardar', cancel: 'Cancelar',
        open: 'Abierto', in_progress: 'En Progreso', resolved: 'Resuelto', closed: 'Cerrado',
        critical: 'Crítica', high: 'Alta', medium: 'Media', low: 'Baja',
        welcome: 'Bienvenido', logout: 'Cerrar Sesión', profile: 'Perfil',
      },
      en: {
        dashboard: 'Dashboard', tickets: 'Tickets', assets: 'Assets', knowledge_base: 'Knowledge Base',
        reports: 'Reports', settings: 'Settings', notifications: 'Notifications',
        search: 'Search', users: 'Users', workflows: 'Workflows',
        create: 'Create', edit: 'Edit', delete: 'Delete', save: 'Save', cancel: 'Cancel',
        open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed',
        critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low',
        welcome: 'Welcome', logout: 'Logout', profile: 'Profile',
      },
      pt: {
        dashboard: 'Painel', tickets: 'Tickets', assets: 'Ativos', knowledge_base: 'Base de Conhecimento',
        reports: 'Relatórios', settings: 'Configurações', notifications: 'Notificações',
        search: 'Pesquisar', users: 'Usuários', workflows: 'Workflows',
        create: 'Criar', edit: 'Editar', delete: 'Excluir', save: 'Salvar', cancel: 'Cancelar',
        open: 'Aberto', in_progress: 'Em Progresso', resolved: 'Resolvido', closed: 'Fechado',
        critical: 'Crítica', high: 'Alta', medium: 'Média', low: 'Baixa',
        welcome: 'Bem-vindo', logout: 'Sair', profile: 'Perfil',
      },
      fr: {
        dashboard: 'Tableau de bord', tickets: 'Tickets', assets: 'Actifs', knowledge_base: 'Base de connaissances',
        reports: 'Rapports', settings: 'Paramètres', notifications: 'Notifications',
        search: 'Recherche', users: 'Utilisateurs', workflows: 'Workflows',
        create: 'Créer', edit: 'Modifier', delete: 'Supprimer', save: 'Enregistrer', cancel: 'Annuler',
        open: 'Ouvert', in_progress: 'En cours', resolved: 'Résolu', closed: 'Fermé',
        critical: 'Critique', high: 'Haute', medium: 'Moyenne', low: 'Basse',
        welcome: 'Bienvenue', logout: 'Déconnexion', profile: 'Profil',
      },
    };

    res.json(translations[lang] || translations.es);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Idiomas disponibles
router.get('/', auth, (req, res) => {
  res.json([
    { code: 'es', name: 'Español', native: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', native: 'English', flag: '🇺🇸' },
    { code: 'pt', name: 'Português', native: 'Português', flag: '🇧🇷' },
    { code: 'fr', name: 'Français', native: 'Français', flag: '🇫🇷' },
  ]);
});

module.exports = router;