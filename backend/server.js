const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });

// Core routes
const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const userRoutes = require('./routes/users');
const assetRoutes = require('./routes/assets');
const notificationRoutes = require('./routes/notifications');
const kbRoutes = require('./routes/knowledgebase');
const reportRoutes = require('./routes/reports');
const emailRoutes = require('./routes/email');
const apiKeyRoutes = require('./routes/apikeys');
const tenantRoutes = require('./routes/tenants');
const auditRoutes = require('./routes/audit');
const slaRoutes = require('./routes/sla');
const workflowRoutes = require('./routes/workflows');
const searchRoutes = require('./routes/search');
const realtimeRoutes = require('./routes/websocket');

// Phase 5+ routes
const twoFactorRoutes = require('./routes/twofactor');
const templateRoutes = require('./routes/templates');
const backupRoutes = require('./routes/backup');
const aiRoutes = require('./routes/ai');

// Phase 6 routes
const integrationRoutes = require('./routes/integrations');
const widgetRoutes = require('./routes/widgets');
const surveyRoutes = require('./routes/surveys');
const timeTrackingRoutes = require('./routes/timetracking');
const customFieldRoutes = require('./routes/customfields');
const i18nRoutes = require('./routes/i18n');

// Phase 7 routes
const chatRoutes = require('./routes/chat');
const documentRoutes = require('./routes/documents');
const barcodeRoutes = require('./routes/barcodes');
const portalRoutes = require('./routes/portal');
const gamificationRoutes = require('./routes/gamification');
const calendarRoutes = require('./routes/calendar');

// Phase 8 routes
const analyticsRoutes = require('./routes/analytics');
const emailTemplateRoutes = require('./routes/emailtemplates');
const bulkRoutes = require('./routes/bulk');
const webhookRoutes = require('./routes/webhooks');

// Phase 9 routes
const mobileRoutes = require('./routes/mobile');
const pwaRoutes = require('./routes/pwa');
const pdfRoutes = require('./routes/pdf');
const permissionRoutes = require('./routes/permissions');
const monitoringRoutes = require('./routes/monitoring');

// Phase 10 routes
const advancedSearchRoutes = require('./routes/advanced-search');
const shortcutsRoutes = require('./routes/shortcuts');
const themeRoutes = require('./routes/theme');
const importRoutes = require('./routes/import');
const sessionRoutes = require('./routes/sessions');
const docsRoutes = require('./routes/docs');

// Phase 11 routes
const contractRoutes = require('./routes/contracts');
const vendorRoutes = require('./routes/vendors');
const purchaseOrderRoutes = require('./routes/purchaseorders');
const assetLifecycleRoutes = require('./routes/assetlifecycle');
const complianceRoutes = require('./routes/compliance');

// Phase 12 routes
const advancedReportsRoutes = require('./routes/advanced-reports');
const dashboardCustomRoutes = require('./routes/dashboard-customization');
const advancedI18nRoutes = require('./routes/advanced-i18n');
const apiVersioningRoutes = require('./routes/api-versioning');
const advancedSecurityRoutes = require('./routes/advanced-security');

// Phase 13 routes
const advancedExportRoutes = require('./routes/advanced-export');
const brandingRoutes = require('./routes/branding');
const notificationPrefRoutes = require('./routes/notification-preferences');
const kbAiSearchRoutes = require('./routes/kb-ai-search');
const visualWorkflowRoutes = require('./routes/visual-workflow');

// Phase 14 routes
const kbVersioningRoutes = require('./routes/kb-versioning');
const onboardingRoutes = require('./routes/onboarding');
const depreciationRoutes = require('./routes/depreciation');
const contractRenewalRoutes = require('./routes/contract-renewal');
const realtimeDashboardRoutes = require('./routes/realtime-dashboard');

// Phase 15 routes
const reportBuilderRoutes = require('./routes/report-builder');
const userGroupRoutes = require('./routes/user-groups');
const kbCategoryRoutes = require('./routes/kb-categories');
const assetTagRoutes = require('./routes/asset-tags');
const rateLimitDashboardRoutes = require('./routes/rate-limit-dashboard');

// Phase 16 routes
const multiCurrencyRoutes = require('./routes/multi-currency');
const advancedAssetLifecycleRoutes = require('./routes/advanced-asset-lifecycle');
const kbRecommendationsRoutes = require('./routes/kb-recommendations');
const notificationChannelRoutes = require('./routes/notification-channels');
const apiAnalyticsRoutes = require('./routes/api-analytics');

// Phase 17 routes
const searchAnalyticsRoutes = require('./routes/search-analytics');
const customWidgetRoutes = require('./routes/custom-widgets');
const barcodeGeneratorRoutes = require('./routes/barcode-generator');
const exportWithChartsRoutes = require('./routes/export-with-charts');
const kbAnalyticsRoutes = require('./routes/kb-analytics');

// Phase 27 routes
const userGroupsManagementRoutes = require('./routes/user-groups-management');
const complianceManagementRoutes = require('./routes/compliance-management');
const contractManagementRoutes = require('./routes/contract-management');

// Phase 28 routes
const vendorManagementRoutes = require('./routes/vendor-management');
const purchaseOrderManagementRoutes = require('./routes/purchase-order-management');
const surveyManagementRoutes = require('./routes/survey-management');

// Phase 29 routes
const webhookManagementRoutes = require('./routes/webhook-management');
const emailTemplateManagementRoutes = require('./routes/email-template-management');
const calendarManagementRoutes = require('./routes/calendar-management');

// Phase 30 routes
const gamificationManagementRoutes = require('./routes/gamification-management');
const systemPerformanceRoutes = require('./routes/system-performance');
const onboardingManagementRoutes = require('./routes/onboarding-management');

// Phase 31 routes
const slaDashboardRoutes = require('./routes/sla-dashboard');
const backupManagementRoutes = require('./routes/backup-management');
const assetHealthRoutes = require('./routes/asset-health');

// Phase 32 routes
const apiUsageAnalyticsRoutes = require('./routes/api-usage-analytics');
const notificationCenterRoutes = require('./routes/notification-center');
const auditTrailRoutes = require('./routes/audit-trail');

// Phase 33 routes
const dashboardWidgetBuilderRoutes = require('./routes/dashboard-widget-builder');
const reportSchedulerRoutes = require('./routes/report-scheduler');
const systemSettingsRoutes = require('./routes/system-settings');

// Phase 34 routes
const ticketTemplateManagerRoutes = require('./routes/ticket-template-manager');
const clientPortalV2Routes = require('./routes/client-portal-v2');
const emailCampaignRoutes = require('./routes/email-campaign');

// Phase 35 routes
const dashboardLayoutManagerRoutes = require('./routes/dashboard-layout-manager');
const slaTrackerRoutes = require('./routes/sla-tracker');
const barcodeGeneratorV2Routes = require('./routes/barcode-generator-v2');

// Phase 36 routes
const roleManagerRoutes = require('./routes/role-manager');
const auditExportRoutes = require('./routes/audit-export');
const i18nManagerRoutes = require('./routes/i18n-manager');

// Phase 37 routes
const activityHeatmapRoutes = require('./routes/activity-heatmap');
const customReportBuilderRoutes = require('./routes/custom-report-builder');
const depreciationCalculatorRoutes = require('./routes/depreciation-calculator');

// Phase 38 routes
const passwordPolicyRoutes = require('./routes/password-policy');
const dataRetentionRoutes = require('./routes/data-retention');
const brandingEditorRoutes = require('./routes/branding-editor');

// Phase 39 routes
const systemHealthRoutes = require('./routes/system-health');
const customFieldManagerRoutes = require('./routes/custom-field-manager');
const escalationRulesRoutes = require('./routes/escalation-rules');

// Phase 40 routes
const integrationHubRoutes = require('./routes/integration-hub');
const notificationRulesRoutes = require('./routes/notification-rules');
const announcementManagerRoutes = require('./routes/announcement-manager');

// Phase 41 routes - GLPI-style asset dropdowns
const assetDropdownsRoutes = require('./routes/asset-dropdowns');
const computerModelsRoutes = require('./routes/computer-models');

// Rutas que existían en /routes pero no estaban conectadas
// - Usadas por páginas del frontend
const advancedAnalyticsRoutes = require('./routes/advanced-analytics');
const advancedAnalyticsV2Routes = require('./routes/advanced-analytics-v2');
const advancedAnalyticsV3Routes = require('./routes/advanced-analytics-v3');
const advancedReportingV2Routes = require('./routes/advanced-reporting-v2');
const advancedWorkflowBuilderRoutes = require('./routes/advanced-workflow-builder');
const aiAdvancedRoutes = require('./routes/ai-advanced');
const barcodeAdvancedRoutes = require('./routes/barcode-advanced');
const collaborationAdvancedRoutes = require('./routes/collaboration-advanced');
const dataImportCsvRoutes = require('./routes/data-import-csv');
const dataValidationRoutes = require('./routes/data-validation');
const mlAnalyticsRoutes = require('./routes/ml-analytics');
const performanceMonitorRoutes = require('./routes/performance-monitor');
const searchAdvancedRoutes = require('./routes/search-advanced');
const userActivityRoutes = require('./routes/user-activity');
const videoConferencingRoutes = require('./routes/video-conferencing');
const voiceCommandsRoutes = require('./routes/voice-commands');
const workflowAdvancedRoutes = require('./routes/workflow-advanced');
const workflowAdvancedV2Routes = require('./routes/workflow-advanced-v2');
// - Disponibles en la API (sin página propia todavía)
const advancedExportExcelRoutes = require('./routes/advanced-export-excel');
const advancedSearchV2Routes = require('./routes/advanced-search-v2');
const apiAdvancedRoutes = require('./routes/api-advanced');
const assetLifecycleAdvancedRoutes = require('./routes/asset-lifecycle-advanced');
const assetTrackingAdvancedRoutes = require('./routes/asset-tracking-advanced');
const backupAdvancedRoutes = require('./routes/backup-advanced');
const brandingAdvancedRoutes = require('./routes/branding-advanced');
const bulkOperationsRoutes = require('./routes/bulk-operations');
const cachingRoutes = require('./routes/caching');
const calendarAdvancedRoutes = require('./routes/calendar-advanced');
const darkModeV2Routes = require('./routes/dark-mode-v2');
const dashboardCustomV1Routes = require('./routes/dashboard-custom');
const documentManagementAdvancedRoutes = require('./routes/document-management-advanced');
const exportAdvancedRoutes = require('./routes/export-advanced');
const formBuilderRoutes = require('./routes/form-builder');
const keyboardShortcutsV2Routes = require('./routes/keyboard-shortcuts-v2');
const knowledgeBaseAdvancedRoutes = require('./routes/knowledge-base-advanced');
const notificationAdvancedRoutes = require('./routes/notification-advanced');
const notificationAdvancedV2Routes = require('./routes/notification-advanced-v2');
const notificationPrefsAdvancedRoutes = require('./routes/notification-preferences-advanced');
const reportAdvancedRoutes = require('./routes/report-advanced');
const sessionAdvancedRoutes = require('./routes/session-advanced');
const sessionManagementV2Routes = require('./routes/session-management-v2');
const userManagementAdvancedRoutes = require('./routes/user-management-advanced');

const app = express();
const PORT = process.env.PORT || 3001;

// En Render la app está detrás de un proxy: así req.ip es la IP real del usuario
// (si no, el rate limit trataría a todos los usuarios como uno solo)
app.set('trust proxy', 1);

// Middleware
// CORS_ORIGIN permite limitar qué dominios llaman a la API (opcional; frontend y API comparten dominio)
app.use(cors(process.env.CORS_ORIGIN ? { origin: process.env.CORS_ORIGIN.split(',') } : {}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting
const { apiLimiter } = require('./middleware/ratelimit');
app.use('/api', apiLimiter);

// Performance monitoring
const { trackMetrics } = require('./routes/monitoring');
app.use(trackMetrics);

// Routes - Core
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/knowledgebase', kbRoutes);

// Routes - Advanced Features
app.use('/api/reports', reportRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/apikeys', apiKeyRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/sla', slaRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/realtime', realtimeRoutes);

// Routes - Phase 5+
app.use('/api/2fa', twoFactorRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/ai', aiRoutes);

// Routes - Phase 6
app.use('/api/integrations', integrationRoutes);
app.use('/api/widgets', widgetRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/time', timeTrackingRoutes);
app.use('/api/custom-fields', customFieldRoutes);
app.use('/api/i18n', i18nRoutes);

// Routes - Phase 7
app.use('/api/chat', chatRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/barcodes', barcodeRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/calendar', calendarRoutes);

// Routes - Phase 8
app.use('/api/analytics', analyticsRoutes);
app.use('/api/email-templates', emailTemplateRoutes);
app.use('/api/bulk', bulkRoutes);
app.use('/api/webhooks', webhookRoutes);

// Routes - Phase 9
app.use('/api/mobile', mobileRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/monitoring', monitoringRoutes);

// Routes - Phase 10
app.use('/api/advanced-search', advancedSearchRoutes);
app.use('/api/shortcuts', shortcutsRoutes);
app.use('/api/theme', themeRoutes);
app.use('/api/import', importRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/docs', docsRoutes);

// Routes - Phase 11
app.use('/api/contracts', contractRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/asset-lifecycle', assetLifecycleRoutes);
app.use('/api/compliance', complianceRoutes);

// Routes - Phase 12
app.use('/api/advanced-reports', advancedReportsRoutes);
app.use('/api/dashboard-custom', dashboardCustomRoutes);
app.use('/api/advanced-i18n', advancedI18nRoutes);
app.use('/api/api-versions', apiVersioningRoutes);
app.use('/api/advanced-security', advancedSecurityRoutes);

// Routes - Phase 13
app.use('/api/advanced-export', advancedExportRoutes);
app.use('/api/branding', brandingRoutes);
app.use('/api/notification-prefs', notificationPrefRoutes);
app.use('/api/kb-ai', kbAiSearchRoutes);
app.use('/api/visual-workflow', visualWorkflowRoutes);

// Routes - Phase 14
app.use('/api/kb-versions', kbVersioningRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/depreciation', depreciationRoutes);
app.use('/api/contract-renewal', contractRenewalRoutes);
app.use('/api/dashboard-live', realtimeDashboardRoutes);

// Routes - Phase 15
app.use('/api/report-builder', reportBuilderRoutes);
app.use('/api/user-groups', userGroupRoutes);
app.use('/api/kb-categories', kbCategoryRoutes);
app.use('/api/asset-tags', assetTagRoutes);
app.use('/api/rate-limit-dashboard', rateLimitDashboardRoutes);

// Routes - Phase 16
app.use('/api/multi-currency', multiCurrencyRoutes);
app.use('/api/advanced-asset-lifecycle', advancedAssetLifecycleRoutes);
app.use('/api/kb-recommendations', kbRecommendationsRoutes);
app.use('/api/notification-channels', notificationChannelRoutes);
app.use('/api/api-analytics', apiAnalyticsRoutes);

// Routes - Phase 17
app.use('/api/search-analytics', searchAnalyticsRoutes);
app.use('/api/custom-widgets', customWidgetRoutes);
app.use('/api/barcode-generator', barcodeGeneratorRoutes);
app.use('/api/export-charts', exportWithChartsRoutes);
app.use('/api/kb-analytics', kbAnalyticsRoutes);

// Routes - Phase 27
app.use('/api/user-groups-management', userGroupsManagementRoutes);
app.use('/api/compliance-management', complianceManagementRoutes);
app.use('/api/contract-management', contractManagementRoutes);

// Routes - Phase 28
app.use('/api/vendor-management', vendorManagementRoutes);
app.use('/api/purchase-order-management', purchaseOrderManagementRoutes);
app.use('/api/survey-management', surveyManagementRoutes);

// Routes - Phase 29
app.use('/api/webhook-management', webhookManagementRoutes);
app.use('/api/email-template-management', emailTemplateManagementRoutes);
app.use('/api/calendar-management', calendarManagementRoutes);

// Routes - Phase 30
app.use('/api/gamification-management', gamificationManagementRoutes);
app.use('/api/system-performance', systemPerformanceRoutes);
app.use('/api/onboarding-management', onboardingManagementRoutes);

// Routes - Phase 31
app.use('/api/sla-dashboard', slaDashboardRoutes);
app.use('/api/backup-management', backupManagementRoutes);
app.use('/api/asset-health', assetHealthRoutes);

// Routes - Phase 32
app.use('/api/api-usage-analytics', apiUsageAnalyticsRoutes);
app.use('/api/notification-center', notificationCenterRoutes);
app.use('/api/audit-trail', auditTrailRoutes);

// Routes - Phase 33
app.use('/api/dashboard-widget-builder', dashboardWidgetBuilderRoutes);
app.use('/api/report-scheduler', reportSchedulerRoutes);
app.use('/api/system-settings', systemSettingsRoutes);

// Routes - Phase 34
app.use('/api/ticket-template-manager', ticketTemplateManagerRoutes);
app.use('/api/client-portal-v2', clientPortalV2Routes);
app.use('/api/email-campaign', emailCampaignRoutes);

// Routes - Phase 35
app.use('/api/dashboard-layout-manager', dashboardLayoutManagerRoutes);
app.use('/api/sla-tracker', slaTrackerRoutes);
app.use('/api/barcode-generator-v2', barcodeGeneratorV2Routes);

// Routes - Phase 36
app.use('/api/role-manager', roleManagerRoutes);
app.use('/api/audit-export', auditExportRoutes);
app.use('/api/i18n-manager', i18nManagerRoutes);

// Routes - Phase 37
app.use('/api/activity-heatmap', activityHeatmapRoutes);
app.use('/api/custom-report-builder', customReportBuilderRoutes);
app.use('/api/depreciation-calculator', depreciationCalculatorRoutes);

// Routes - Phase 38
app.use('/api/password-policy', passwordPolicyRoutes);
app.use('/api/data-retention', dataRetentionRoutes);
app.use('/api/branding-editor', brandingEditorRoutes);

// Routes - Phase 39
app.use('/api/system-health', systemHealthRoutes);
app.use('/api/custom-field-manager', customFieldManagerRoutes);
app.use('/api/escalation-rules', escalationRulesRoutes);

// Routes - Phase 40
app.use('/api/integration-hub', integrationHubRoutes);
app.use('/api/notification-rules', notificationRulesRoutes);
app.use('/api/announcement-manager', announcementManagerRoutes);

// Routes - Phase 41
app.use('/api/asset-dropdowns', assetDropdownsRoutes);
app.use('/api/computer-models', computerModelsRoutes);

// Routes - antes desconectadas, usadas por el frontend
// (varios routers comparten prefijo: Express prueba cada uno en orden)
app.use('/api/advanced-analytics', advancedAnalyticsRoutes);
app.use('/api/advanced-analytics', advancedAnalyticsV2Routes);
app.use('/api/advanced-analytics', advancedAnalyticsV3Routes);
app.use('/api/advanced-reporting', advancedReportingV2Routes);
app.use('/api/advanced-workflow-builder', advancedWorkflowBuilderRoutes);
app.use('/api/ai-advanced', aiAdvancedRoutes);
app.use('/api/barcode', barcodeAdvancedRoutes);
app.use('/api/collaboration', collaborationAdvancedRoutes);
app.use('/api/data-import', dataImportCsvRoutes);
app.use('/api/data-validation', dataValidationRoutes);
app.use('/api/ml-analytics', mlAnalyticsRoutes);
app.use('/api/performance-monitor', performanceMonitorRoutes);
app.use('/api/search-advanced', searchAdvancedRoutes);
app.use('/api/user-activity', userActivityRoutes);
app.use('/api/video-conferencing', videoConferencingRoutes);
app.use('/api/voice-commands', voiceCommandsRoutes);
app.use('/api/workflow-advanced', workflowAdvancedRoutes);
app.use('/api/workflow-advanced', workflowAdvancedV2Routes);
app.use('/api/asset-lifecycle', assetLifecycleAdvancedRoutes);      // /maintenance/scheduled
app.use('/api/branding', brandingAdvancedRoutes);                   // /config
app.use('/api/notifications', notificationAdvancedRoutes);          // /channels, /preferences
app.use('/api/notification-prefs', notificationPrefsAdvancedRoutes); // /detailed

// Routes - antes desconectadas, disponibles solo por API
app.use('/api/advanced-export', advancedExportExcelRoutes);
app.use('/api/advanced-search', advancedSearchV2Routes);
app.use('/api/api-advanced', apiAdvancedRoutes);
app.use('/api/asset-tracking', assetTrackingAdvancedRoutes);
app.use('/api/backup-advanced', backupAdvancedRoutes);
app.use('/api/bulk-operations', bulkOperationsRoutes);
app.use('/api/cache', cachingRoutes);
app.use('/api/calendar-advanced', calendarAdvancedRoutes);
app.use('/api/dark-mode', darkModeV2Routes);
app.use('/api/dashboard-custom', dashboardCustomV1Routes);
app.use('/api/document-management', documentManagementAdvancedRoutes);
app.use('/api/export-advanced', exportAdvancedRoutes);
app.use('/api/form-builder', formBuilderRoutes);
app.use('/api/keyboard-shortcuts', keyboardShortcutsV2Routes);
app.use('/api/knowledge-base-advanced', knowledgeBaseAdvancedRoutes);
app.use('/api/notification-advanced', notificationAdvancedV2Routes);
app.use('/api/report-advanced', reportAdvancedRoutes);
app.use('/api/reports/advanced', reportAdvancedRoutes); // página Reportes avanzados
app.use('/api/export', exportAdvancedRoutes);           // /export/csv/:entity
app.use('/api/session-advanced', sessionAdvancedRoutes);
app.use('/api/session-management', sessionManagementV2Routes);
app.use('/api/user-management', userManagementAdvancedRoutes);

// PWA Routes
app.use('/', pwaRoutes);

// Public API (using API key authentication)
const { publicRouter } = require('./routes/apikeys');
app.use('/api/v1', publicRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'ITAMS API is running', 
    version: '40.0.0',
    features: [
      'authentication', 'two-factor-auth', 'tickets', 'ticket-templates',
      'assets', 'notifications', 'knowledge-base', 'reports', 'email-integration',
      'public-api', 'multi-tenant', 'audit-logs', 'sla-management',
      'workflow-automation', 'advanced-search', 'real-time-updates', 'backup-system',
      'ai-categorization', 'ai-insights', 'integrations', 'dashboard-widgets',
      'satisfaction-surveys', 'time-tracking', 'custom-fields', 'i18n',
      'real-time-chat', 'document-management', 'barcode-qr', 'client-portal',
      'gamification', 'calendar', 'advanced-analytics', 'email-templates',
      'bulk-actions', 'webhooks', 'rate-limiting', 'mobile-api', 'pwa-support',
      'pdf-export', 'rbac-permissions', 'performance-monitoring',
      'advanced-search-filters', 'keyboard-shortcuts', 'dark-mode', 'data-import',
      'session-management', 'api-documentation', 'contract-management',
      'vendor-management', 'purchase-orders', 'asset-lifecycle', 'compliance-tracking',
      'advanced-reports', 'dashboard-customization', 'multi-language-advanced',
      'api-versioning', 'advanced-security', 'advanced-export', 'custom-branding',
      'notification-preferences', 'kb-ai-search', 'visual-workflow-builder',
      'kb-versioning', 'user-onboarding', 'asset-depreciation', 'contract-renewal',
      'realtime-dashboard', 'custom-report-builder', 'user-groups', 'kb-categories',
      'asset-tagging', 'rate-limit-dashboard', 'multi-currency', 'advanced-asset-lifecycle',
      'kb-recommendations', 'notification-channels', 'api-analytics',
      'search-analytics', 'custom-dashboard-widgets', 'barcode-generator',
      'export-with-charts', 'kb-analytics',
    ]
  });
});

// Frontend (React compilado en frontend/dist): una sola URL para la app y la API
const FRONTEND_DIST = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  // Cualquier ruta que no sea de la API devuelve index.html (React Router se encarga)
  app.get('/{*splat}', (req, res, next) => {
    // /^\/(api|uploads)(\/|$)/ y no startsWith('/api'): páginas como /apikeys o /api-analytics son del frontend
    if (/^\/(api|uploads)(\/|$)/.test(req.path)) return next();
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`ITAMS API v40.0 running on port ${PORT}`);
});
