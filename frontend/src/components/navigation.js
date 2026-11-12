// Mapa de navegación de ITAMS: todos los módulos agrupados y en español.
// Lo usan el menú lateral (Layout) y el encabezado (ruta de navegación).
import {
  LayoutDashboard, Ticket, Monitor, BookOpen, CalendarDays, Bell, Boxes, Recycle, HeartPulse,
  TrendingDown, ScanBarcode, Barcode, Layers, FileText, Headset, FilePlus2, Files, Clock4,
  Timer, Siren, ClipboardCheck, Users2, MessagesSquare, ShoppingCart, Truck, Receipt,
  FileSignature, Coins, BarChart3, LineChart, PieChart, Presentation, UserCheck, Smile,
  FileBarChart, CalendarClock, Download, Activity, Sparkles, BrainCircuit, Workflow, GitBranch,
  LayoutTemplate, BellRing, Webhook, Plug, Network, KeyRound, Gauge, Megaphone, Mail, Send,
  Video, Mic, Trophy, Palette, LayoutGrid, Puzzle, SlidersHorizontal, Brush, Languages,
  ShieldCheck, Users, UserCog, ShieldAlert, Fingerprint, LockKeyhole, ScrollText, History,
  FileDown, BadgeCheck, Archive, Settings, AtSign, DatabaseBackup, HardDrive, Server, Cpu,
  Upload, CheckCheck, Search, ListChecks, Rocket, BellDot,
} from 'lucide-react';

export const NAV_GROUPS = [
  {
    id: 'principal',
    label: 'Principal',
    items: [
      { path: '/dashboard', label: 'Panel principal', icon: LayoutDashboard },
      { path: '/tickets', label: 'Tickets', icon: Ticket },
      { path: '/assets', label: 'Activos', icon: Monitor },
      { path: '/knowledgebase', label: 'Base de conocimiento', icon: BookOpen },
      { path: '/calendar', label: 'Calendario', icon: CalendarDays },
      { path: '/notifications', label: 'Notificaciones', icon: Bell },
    ],
  },
  {
    id: 'activos',
    label: 'Gestión de activos',
    icon: Boxes,
    items: [
      { path: '/assets/new', label: 'Registrar activo', icon: FilePlus2 },
      { path: '/assets/lifecycle', label: 'Ciclo de vida', icon: Recycle },
      { path: '/asset-health', label: 'Salud de activos', icon: HeartPulse },
      { path: '/depreciation', label: 'Depreciación', icon: TrendingDown },
      { path: '/barcode-generator-v2', label: 'Códigos de barras', icon: Barcode },
      { path: '/assets/bulk', label: 'Operaciones masivas', icon: Layers },
      { path: '/documents', label: 'Documentos', icon: FileText },
    ],
  },
  {
    id: 'soporte',
    label: 'Mesa de ayuda',
    icon: Headset,
    items: [
      { path: '/tickets/new', label: 'Nuevo ticket', icon: FilePlus2 },
      { path: '/templates', label: 'Plantillas de tickets', icon: Files },
      { path: '/sla', label: 'Acuerdos de servicio (SLA)', icon: Clock4 },
      { path: '/sla-tracker', label: 'Seguimiento de SLA', icon: Timer },
      { path: '/escalation-rules', label: 'Reglas de escalamiento', icon: Siren },
      { path: '/time-tracking', label: 'Registro de tiempo', icon: Clock4 },
      { path: '/surveys', label: 'Encuestas', icon: ClipboardCheck },
      { path: '/client-portal', label: 'Portal de clientes', icon: Users2 },
      { path: '/collaboration', label: 'Colaboración', icon: MessagesSquare },
      { path: '/knowledgebase/new', label: 'Nuevo artículo', icon: BookOpen },
    ],
  },
  {
    id: 'compras',
    label: 'Compras y contratos',
    icon: ShoppingCart,
    admin: true,
    items: [
      { path: '/vendors', label: 'Proveedores', icon: Truck },
      { path: '/purchase-orders', label: 'Órdenes de compra', icon: Receipt },
      { path: '/contracts', label: 'Contratos', icon: FileSignature },
      { path: '/multi-currency', label: 'Monedas', icon: Coins },
    ],
  },
  {
    id: 'reportes',
    label: 'Reportes y analítica',
    icon: BarChart3,
    admin: true,
    items: [
      { path: '/reports', label: 'Reportes', icon: FileBarChart },
      { path: '/dashboard/executive', label: 'Panel ejecutivo', icon: Presentation },
      { path: '/reports/technician', label: 'Desempeño de técnicos', icon: UserCheck },
      { path: '/reports/satisfaction', label: 'Satisfacción', icon: Smile },
      { path: '/report-builder', label: 'Constructor de reportes', icon: SlidersHorizontal },
      { path: '/report-scheduler', label: 'Reportes programados', icon: CalendarClock },
      { path: '/reports/export', label: 'Exportar datos', icon: Download },
      { path: '/knowledgebase/analytics', label: 'Analítica de la base', icon: BarChart3 },
      { path: '/activity-heatmap', label: 'Mapa de actividad', icon: Activity },
      { path: '/ai-insights', label: 'Análisis con IA', icon: Sparkles },
      { path: '/ml-analytics', label: 'Predicciones (ML)', icon: Cpu },
    ],
  },
  {
    id: 'automatizacion',
    label: 'Automatización',
    icon: Workflow,
    admin: true,
    items: [
      { path: '/workflows', label: 'Flujos de trabajo', icon: Workflow },
      { path: '/workflows/templates', label: 'Plantillas de flujos', icon: LayoutTemplate },
      { path: '/notification-rules', label: 'Reglas de notificación', icon: BellRing },
      { path: '/webhooks', label: 'Webhooks', icon: Webhook },
      { path: '/integrations', label: 'Integraciones', icon: Plug },
      { path: '/apikeys', label: 'Claves de API', icon: KeyRound },
      { path: '/api-analytics', label: 'Uso de la API', icon: Gauge },
    ],
  },
  {
    id: 'comunicacion',
    label: 'Comunicación',
    icon: Megaphone,
    admin: true,
    items: [
      { path: '/announcements', label: 'Anuncios', icon: Megaphone },
      { path: '/email-templates', label: 'Plantillas de correo', icon: Mail },
      { path: '/email-campaigns', label: 'Campañas de correo', icon: Send },
      { path: '/video-conferencing', label: 'Videoconferencias', icon: Video },
      { path: '/voice-commands', label: 'Comandos de voz', icon: Mic },
      { path: '/gamification', label: 'Gamificación', icon: Trophy },
    ],
  },
  {
    id: 'personalizacion',
    label: 'Personalización',
    icon: Palette,
    admin: true,
    items: [
      { path: '/dashboard/custom', label: 'Panel personalizado', icon: LayoutGrid },
      { path: '/custom-fields', label: 'Campos personalizados', icon: SlidersHorizontal },
      { path: '/branding-editor', label: 'Editor de marca', icon: Brush },
      { path: '/i18n-manager', label: 'Idiomas', icon: Languages },
    ],
  },
  {
    id: 'seguridad',
    label: 'Usuarios y seguridad',
    icon: ShieldCheck,
    admin: true,
    items: [
      { path: '/user-groups', label: 'Grupos de usuarios', icon: Users },
      { path: '/role-manager', label: 'Roles y permisos', icon: UserCog },
      { path: '/user-activity', label: 'Actividad de usuarios', icon: Activity },
      { path: '/security', label: 'Panel de seguridad', icon: ShieldAlert },
      { path: '/settings/2fa', label: 'Verificación en dos pasos', icon: Fingerprint },
      { path: '/password-policy', label: 'Política de contraseñas', icon: LockKeyhole },
      { path: '/audit', label: 'Auditoría', icon: ScrollText },
      { path: '/audit-export', label: 'Exportar auditoría', icon: FileDown },
      { path: '/compliance', label: 'Cumplimiento', icon: BadgeCheck },
      { path: '/data-retention', label: 'Retención de datos', icon: Archive },
    ],
  },
  {
    id: 'sistema',
    label: 'Sistema',
    icon: Settings,
    admin: true,
    items: [
      { path: '/system-settings', label: 'Configuración general', icon: Settings },
      { path: '/settings/email', label: 'Correo saliente', icon: AtSign },
      { path: '/notifications/preferences', label: 'Preferencias de avisos', icon: BellRing },
      { path: '/settings/backup', label: 'Copias de seguridad', icon: DatabaseBackup },
      { path: '/system-health', label: 'Estado del sistema', icon: Server },
      { path: '/system-performance', label: 'Rendimiento', icon: Gauge },
      { path: '/import', label: 'Importar datos', icon: Upload },
      { path: '/validation', label: 'Validación de datos', icon: CheckCheck },
      { path: '/search', label: 'Búsqueda avanzada', icon: Search },
      { path: '/onboarding', label: 'Guía de inicio', icon: Rocket },
    ],
  },
];

// Busca la página actual (la ruta más específica que coincida) y su grupo
export function findNav(pathname) {
  let best = null;
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      const match = pathname === item.path || pathname.startsWith(item.path + '/');
      if (match && (!best || item.path.length > best.item.path.length)) best = { group, item };
    }
  }
  return best;
}
