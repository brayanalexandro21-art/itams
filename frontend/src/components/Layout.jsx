import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../services/api';

function Layout({ user, onLogout }) {
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showAutomation, setShowAutomation] = useState(false);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const mainNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/tickets', label: 'Tickets', icon: '🎫' },
    { path: '/assets', label: 'Assets', icon: '💻' },
    { path: '/knowledgebase', label: 'Knowledge Base', icon: '📚' },
    { path: '/time-tracking', label: 'Time Tracking', icon: '⏱️' },
  ];

  const adminNavItems = [
    { path: '/reports', label: 'Reports', icon: '📈' },
    { path: '/apikeys', label: 'API Keys', icon: '🔑' },
    { path: '/sla', label: 'SLA Management', icon: '📋' },
    { path: '/audit', label: 'Audit Logs', icon: '📝' },
    { path: '/ai-insights', label: 'AI Insights', icon: '🤖' },
    { path: '/integrations', label: 'Integrations', icon: '🔗' },
  ];

  const automationItems = [
    { path: '/workflows', label: 'Workflows', icon: '⚡' },
    { path: '/templates', label: 'Templates', icon: '📄' },
  ];

  const settingsItems = [
    { path: '/settings/email', label: 'Email Settings', icon: '📧' },
    { path: '/settings/2fa', label: '2FA Security', icon: '🔒' },
    { path: '/settings/backup', label: 'Backup', icon: '💾' },
  ];

  const quickActions = [
    { path: '/tickets/new', label: 'New Ticket', icon: '➕' },
  ];

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-indigo-700 text-white overflow-y-auto">
        <div className="flex items-center justify-center h-16 bg-indigo-800">
          <h1 className="text-xl font-bold">ITAMS</h1>
          <span className="ml-2 text-xs bg-indigo-600 px-2 py-0.5 rounded">v6.0</span>
        </div>

        {/* Main Navigation */}
        <nav className="mt-6">
          {mainNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                isActive(item.path)
                  ? 'bg-indigo-800 text-white'
                  : 'text-indigo-200 hover:bg-indigo-600 hover:text-white'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Admin Navigation */}
        {user.role === 'admin' && (
          <>
            <div className="px-6 mt-6 mb-2">
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                Administration
              </span>
            </div>
            <nav>
              {adminNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-indigo-800 text-white'
                      : 'text-indigo-200 hover:bg-indigo-600 hover:text-white'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </Link>
              ))}

              {/* Automation Dropdown */}
              <button
                onClick={() => setShowAutomation(!showAutomation)}
                className="w-full flex items-center px-6 py-3 text-sm font-medium text-indigo-200 hover:bg-indigo-600 hover:text-white transition-colors"
              >
                <span className="mr-3">🤖</span>
                Automation
                <span className="ml-auto">{showAutomation ? '▾' : '▸'}</span>
              </button>
              {showAutomation && (
                <div className="bg-indigo-800">
                  {automationItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center px-10 py-2 text-sm font-medium transition-colors ${
                        isActive(item.path)
                          ? 'bg-indigo-700 text-white'
                          : 'text-indigo-300 hover:bg-indigo-600 hover:text-white'
                      }`}
                    >
                      <span className="mr-3">{item.icon}</span>
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}

              {/* Settings Dropdown */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="w-full flex items-center px-6 py-3 text-sm font-medium text-indigo-200 hover:bg-indigo-600 hover:text-white transition-colors"
              >
                <span className="mr-3">⚙️</span>
                Settings
                <span className="ml-auto">{showSettings ? '▾' : '▸'}</span>
              </button>
              {showSettings && (
                <div className="bg-indigo-800">
                  {settingsItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center px-10 py-2 text-sm font-medium transition-colors ${
                        isActive(item.path)
                          ? 'bg-indigo-700 text-white'
                          : 'text-indigo-300 hover:bg-indigo-600 hover:text-white'
                      }`}
                    >
                      <span className="mr-3">{item.icon}</span>
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </nav>
          </>
        )}

        {/* Quick Actions */}
        <div className="px-6 mt-6 mb-2">
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            Quick Actions
          </span>
        </div>
        <nav>
          {quickActions.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center px-6 py-3 text-sm font-medium text-indigo-200 hover:bg-indigo-600 hover:text-white transition-colors"
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User Info */}
        <div className="absolute bottom-0 w-full p-4 border-t border-indigo-600">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-indigo-300">{user.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {mainNavItems.find((item) => isActive(item.path))?.label ||
                  adminNavItems.find((item) => isActive(item.path))?.label ||
                  automationItems.find((item) => isActive(item.path))?.label ||
                  settingsItems.find((item) => isActive(item.path))?.label ||
                  'ITAMS'}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <Link
                to="/notifications"
                className="relative p-2 text-gray-600 hover:text-indigo-600 transition-colors"
              >
                <span className="text-xl">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* User Menu */}
              <div className="flex items-center space-x-3 pl-4 border-l">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-800">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <button
                  onClick={onLogout}
                  className="px-3 py-1.5 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
