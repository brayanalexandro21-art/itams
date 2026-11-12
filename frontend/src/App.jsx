import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TicketList from './pages/TicketList';
import TicketDetail from './pages/TicketDetail';
import CreateTicket from './pages/CreateTicket';
import AssetList from './pages/AssetList';
import AssetDetail from './pages/AssetDetail';
import CreateAsset from './pages/CreateAsset';
import KnowledgeBase from './pages/KnowledgeBase';
import ArticleDetail from './pages/ArticleDetail';
import CreateArticle from './pages/CreateArticle';
import Notifications from './pages/Notifications';
import Reports from './pages/Reports';
import ApiKeys from './pages/ApiKeys';
import EmailSettings from './pages/EmailSettings';
import AuditLogs from './pages/AuditLogs';
import SlaManagement from './pages/SlaManagement';
import Workflows from './pages/Workflows';
import TwoFactorAuth from './pages/TwoFactorAuth';
import TicketTemplates from './pages/TicketTemplates';
import AiInsights from './pages/AiInsights';
import BackupSettings from './pages/BackupSettings';
import Integrations from './pages/Integrations';
import TimeTracking from './pages/TimeTracking';
// Phase 19 imports
import CustomDashboard from './pages/CustomDashboard';
import AssetLifecycle from './pages/AssetLifecycle';
import ExportTools from './pages/ExportTools';
// Phase 20 imports
import BulkOperations from './pages/BulkOperations';
import SearchAdvanced from './pages/SearchAdvanced';
import KBAnalytics from './pages/KBAnalytics';
import UserActivity from './pages/UserActivity';
// Phase 21 imports
import MLAnalytics from './pages/MLAnalytics';
import VoiceCommands from './pages/VoiceCommands';
import VideoConferencing from './pages/VideoConferencing';
import MultiCurrency from './pages/MultiCurrency';
// Phase 22 imports
import NotificationPreferencesAdvanced from './pages/NotificationPreferencesAdvanced';
import DataValidation from './pages/DataValidation';
// Phase 23 imports
import Collaboration from './pages/Collaboration';
import DocumentManager from './pages/DocumentManager';
import SecurityDashboard from './pages/SecurityDashboard';
// Phase 24 imports
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import TechnicianPerformance from './pages/TechnicianPerformance';
import SatisfactionReport from './pages/SatisfactionReport';
// Phase 25 imports
import WorkflowTemplates from './pages/WorkflowTemplates';
// Phase 26 imports
import DataImportAdvanced from './pages/DataImportAdvanced';
// Phase 27 imports
import UserGroupsManagement from './pages/UserGroupsManagement';
import ComplianceDashboard from './pages/ComplianceDashboard';
import ContractManagement from './pages/ContractManagement';
// Phase 28 imports
import VendorManagement from './pages/VendorManagement';
import PurchaseOrderManagement from './pages/PurchaseOrderManagement';
import SurveyManagement from './pages/SurveyManagement';
// Phase 29 imports
import WebhookManagement from './pages/WebhookManagement';
import EmailTemplateManagement from './pages/EmailTemplateManagement';
import CalendarManagement from './pages/CalendarManagement';
// Phase 30 imports
import GamificationDashboard from './pages/GamificationDashboard';
import SystemPerformance from './pages/SystemPerformance';
import OnboardingGuide from './pages/OnboardingGuide';
// Phase 31 imports
import AssetHealthMonitor from './pages/AssetHealthMonitor';
// Phase 32 imports
import ApiUsageAnalytics from './pages/ApiUsageAnalytics';
// Phase 33 imports
import ReportScheduler from './pages/ReportScheduler';
import SystemSettings from './pages/SystemSettings';
// Phase 34 imports
import ClientPortalDashboard from './pages/ClientPortalDashboard';
import EmailCampaignManager from './pages/EmailCampaignManager';
// Phase 35 imports
import SLATracker from './pages/SLATracker';
import BarcodeGeneratorV2 from './pages/BarcodeGeneratorV2';
// Phase 36 imports
import RoleManager from './pages/RoleManager';
import AuditExport from './pages/AuditExport';
import I18nManager from './pages/I18nManager';
// Phase 37 imports
import ActivityHeatmap from './pages/ActivityHeatmap';
import CustomReportBuilder from './pages/CustomReportBuilder';
import DepreciationCalculator from './pages/DepreciationCalculator';
// Phase 38 imports
import PasswordPolicy from './pages/PasswordPolicy';
import DataRetention from './pages/DataRetention';
import BrandingEditor from './pages/BrandingEditor';
// Phase 39 imports
import SystemHealth from './pages/SystemHealth';
import CustomFieldManager from './pages/CustomFieldManager';
import EscalationRules from './pages/EscalationRules';
// Phase 40 imports
import NotificationRules from './pages/NotificationRules';
import AnnouncementManager from './pages/AnnouncementManager';
import Layout from './components/Layout';
import './index.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-500">Cargando…</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login onLogin={login} /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!user ? <Register onLogin={login} /> : <Navigate to="/dashboard" />} />
        <Route path="/" element={user ? <Layout user={user} onLogout={logout} /> : <Navigate to="/login" />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="dashboard/custom" element={<CustomDashboard />} />
          <Route path="dashboard/executive" element={<ExecutiveDashboard />} />
          <Route path="dashboard/advanced" element={<Navigate to="/dashboard" replace />} />
          <Route path="tickets" element={<TicketList />} />
          <Route path="tickets/new" element={<CreateTicket />} />
          <Route path="tickets/:id" element={<TicketDetail />} />
          <Route path="assets" element={<AssetList />} />
          <Route path="assets/new" element={<CreateAsset />} />
          <Route path="assets/:id" element={<AssetDetail />} />
          <Route path="assets/lifecycle" element={<AssetLifecycle />} />
          <Route path="assets/barcode" element={<Navigate to="/barcode-generator-v2" replace />} />
          <Route path="assets/bulk" element={<BulkOperations />} />
          <Route path="knowledgebase" element={<KnowledgeBase />} />
          <Route path="knowledgebase/new" element={<CreateArticle />} />
          <Route path="knowledgebase/:id" element={<ArticleDetail />} />
          <Route path="knowledgebase/analytics" element={<KBAnalytics />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="notifications/settings" element={<Navigate to="/notifications/preferences" replace />} />
          <Route path="notifications/preferences" element={<NotificationPreferencesAdvanced />} />
          <Route path="reports" element={<Reports />} />
          <Route path="reports/advanced" element={<Navigate to="/reports" replace />} />
          <Route path="reports/executive" element={<Navigate to="/dashboard/executive" replace />} />
          <Route path="reports/technician" element={<TechnicianPerformance />} />
          <Route path="reports/satisfaction" element={<SatisfactionReport />} />
          <Route path="reports/export" element={<ExportTools />} />
          <Route path="apikeys" element={<ApiKeys />} />
          <Route path="search" element={<SearchAdvanced />} />
          <Route path="search/v2" element={<Navigate to="/search" replace />} />
          <Route path="import" element={<DataImportAdvanced />} />
          <Route path="validation" element={<DataValidation />} />
          <Route path="security" element={<SecurityDashboard />} />
          <Route path="collaboration" element={<Collaboration />} />
          <Route path="documents" element={<DocumentManager />} />
          <Route path="settings/email" element={<EmailSettings />} />
          <Route path="settings/2fa" element={<TwoFactorAuth />} />
          <Route path="settings/backup" element={<BackupSettings />} />
          <Route path="settings/performance" element={<Navigate to="/system-performance" replace />} />
          <Route path="settings/branding" element={<Navigate to="/branding-editor" replace />} />
          <Route path="audit" element={<AuditLogs />} />
          <Route path="sla" element={<SlaManagement />} />
          <Route path="workflows" element={<Workflows />} />
          <Route path="workflows/advanced" element={<Navigate to="/workflows" replace />} />
          <Route path="workflows/templates" element={<WorkflowTemplates />} />
          <Route path="templates" element={<TicketTemplates />} />
          <Route path="ai-insights" element={<AiInsights />} />
          <Route path="ai-advanced" element={<Navigate to="/ml-analytics" replace />} />
          <Route path="ml-analytics" element={<MLAnalytics />} />
          <Route path="voice-commands" element={<VoiceCommands />} />
          <Route path="video-conferencing" element={<VideoConferencing />} />
          <Route path="multi-currency" element={<MultiCurrency />} />
          <Route path="integrations" element={<Integrations />} />
          <Route path="time-tracking" element={<TimeTracking />} />
          <Route path="user-activity" element={<UserActivity />} />
          <Route path="user-groups" element={<UserGroupsManagement />} />
          <Route path="compliance" element={<ComplianceDashboard />} />
          <Route path="contracts" element={<ContractManagement />} />
          <Route path="vendors" element={<VendorManagement />} />
          <Route path="purchase-orders" element={<PurchaseOrderManagement />} />
          <Route path="surveys" element={<SurveyManagement />} />
          <Route path="webhooks" element={<WebhookManagement />} />
          <Route path="email-templates" element={<EmailTemplateManagement />} />
          <Route path="calendar" element={<CalendarManagement />} />
          <Route path="gamification" element={<GamificationDashboard />} />
          <Route path="system-performance" element={<SystemPerformance />} />
          <Route path="onboarding" element={<OnboardingGuide />} />
          <Route path="sla-dashboard" element={<Navigate to="/sla" replace />} />
          <Route path="backup-management" element={<Navigate to="/settings/backup" replace />} />
          <Route path="asset-health" element={<AssetHealthMonitor />} />
          <Route path="api-analytics" element={<ApiUsageAnalytics />} />
          <Route path="notification-center" element={<Navigate to="/notifications" replace />} />
          <Route path="audit-trail" element={<Navigate to="/audit" replace />} />
          <Route path="dashboard-builder" element={<Navigate to="/dashboard/custom" replace />} />
          <Route path="report-scheduler" element={<ReportScheduler />} />
          <Route path="system-settings" element={<SystemSettings />} />
          <Route path="ticket-templates-manager" element={<Navigate to="/templates" replace />} />
          <Route path="client-portal" element={<ClientPortalDashboard />} />
          <Route path="email-campaigns" element={<EmailCampaignManager />} />
          <Route path="dashboard-layouts" element={<Navigate to="/dashboard/custom" replace />} />
          <Route path="sla-tracker" element={<SLATracker />} />
          <Route path="barcode-generator-v2" element={<BarcodeGeneratorV2 />} />
          <Route path="role-manager" element={<RoleManager />} />
          <Route path="audit-export" element={<AuditExport />} />
          <Route path="i18n-manager" element={<I18nManager />} />
          <Route path="activity-heatmap" element={<ActivityHeatmap />} />
          <Route path="report-builder" element={<CustomReportBuilder />} />
          <Route path="depreciation" element={<DepreciationCalculator />} />
          <Route path="password-policy" element={<PasswordPolicy />} />
          <Route path="data-retention" element={<DataRetention />} />
          <Route path="branding-editor" element={<BrandingEditor />} />
          <Route path="system-health" element={<SystemHealth />} />
          <Route path="custom-fields" element={<CustomFieldManager />} />
          <Route path="escalation-rules" element={<EscalationRules />} />
          <Route path="integration-hub" element={<Navigate to="/integrations" replace />} />
          <Route path="notification-rules" element={<NotificationRules />} />
          <Route path="announcements" element={<AnnouncementManager />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
        <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </Router>
  );
}

export default App;