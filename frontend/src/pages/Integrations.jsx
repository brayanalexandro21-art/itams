import { useState, useEffect } from 'react';
import api from '../services/api';

function Integrations() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(null);
  const [configData, setConfigData] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });

  const integrationTypes = [
    { type: 'slack', name: 'Slack', icon: '💬', description: 'Send notifications to Slack channels' },
    { type: 'discord', name: 'Discord', icon: '🎮', description: 'Send notifications to Discord servers' },
    { type: 'whatsapp', name: 'WhatsApp', icon: '📱', description: 'Send notifications via WhatsApp' },
    { type: 'teams', name: 'Microsoft Teams', icon: '👥', description: 'Send notifications to Teams channels' },
    { type: 'telegram', name: 'Telegram', icon: '✈️', description: 'Send notifications via Telegram bot' },
    { type: 'webhook', name: 'Custom Webhook', icon: '🔗', description: 'Send notifications to any URL' },
  ];

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const response = await api.get('/integrations');
      setIntegrations(response.data);
    } catch (error) {
      console.error('Error fetching integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigure = (type) => {
    setShowConfig(type);
    setConfigData({});
    setMessage({ type: '', text: '' });
  };

  const handleSave = async () => {
    try {
      await api.post('/integrations', {
        name: integrationTypes.find(t => t.type === showConfig)?.name,
        type: showConfig,
        config: configData,
        active: true,
      });
      setMessage({ type: 'success', text: 'Integration saved successfully' });
      setShowConfig(null);
      fetchIntegrations();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save integration' });
    }
  };

  const handleTest = async (id) => {
    try {
      await api.post(`/integrations/${id}/test`);
      setMessage({ type: 'success', text: 'Test message sent' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send test' });
    }
  };

  const handleToggle = async (id) => {
    try {
      await api.put(`/integrations/${id}/toggle`);
      fetchIntegrations();
    } catch (error) {
      console.error('Error toggling integration:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this integration?')) {
      try {
        await api.delete(`/integrations/${id}`);
        fetchIntegrations();
      } catch (error) {
        console.error('Error deleting integration:', error);
      }
    }
  };

  const isConfigured = (type) => {
    return integrations.some(i => i.type === type);
  };

  const getConfig = (type) => {
    return integrations.find(i => i.type === type);
  };

  const renderConfigForm = () => {
    switch (showConfig) {
      case 'slack':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL *</label>
              <input
                type="url"
                value={configData.webhook_url || ''}
                onChange={(e) => setConfigData({ ...configData, webhook_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="https://hooks.slack.com/services/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
              <input
                type="text"
                value={configData.channel || ''}
                onChange={(e) => setConfigData({ ...configData, channel: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="#support"
              />
            </div>
          </>
        );
      case 'discord':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL *</label>
            <input
              type="url"
              value={configData.webhook_url || ''}
              onChange={(e) => setConfigData({ ...configData, webhook_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="https://discord.com/api/webhooks/..."
            />
          </div>
        );
      case 'whatsapp':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                value={configData.phone || ''}
                onChange={(e) => setConfigData({ ...configData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="+1234567890"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
              <input
                type="password"
                value={configData.api_key || ''}
                onChange={(e) => setConfigData({ ...configData, api_key: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </>
        );
      default:
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL *</label>
            <input
              type="url"
              value={configData.webhook_url || ''}
              onChange={(e) => setConfigData({ ...configData, webhook_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="https://your-webhook-url.com"
            />
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Integrations</h2>

      {message.text && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Integration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrationTypes.map((type) => {
          const configured = isConfigured(type.type);
          const config = getConfig(type.type);

          return (
            <div key={type.type} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <span className="text-3xl mr-3">{type.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-800">{type.name}</h3>
                    <p className="text-sm text-gray-500">{type.description}</p>
                  </div>
                </div>
                {configured && (
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${config?.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {config?.active ? 'Active' : 'Inactive'}
                  </span>
                )}
              </div>

              <div className="mt-4 flex space-x-2">
                {configured ? (
                  <>
                    <button
                      onClick={() => handleTest(config.id)}
                      className="flex-1 px-3 py-2 bg-indigo-100 text-indigo-800 rounded-lg hover:bg-indigo-200 text-sm"
                    >
                      Test
                    </button>
                    <button
                      onClick={() => handleToggle(config.id)}
                      className="px-3 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 text-sm"
                    >
                      {config?.active ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDelete(config.id)}
                      className="px-3 py-2 text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleConfigure(type.type)}
                    className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                  >
                    Configure
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Configuration Modal */}
      {showConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Configure {integrationTypes.find(t => t.type === showConfig)?.name}
            </h3>
            <div className="space-y-4">
              {renderConfigForm()}
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={() => setShowConfig(null)}
                  className="px-4 py-2 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Integrations;
