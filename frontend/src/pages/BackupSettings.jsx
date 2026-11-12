import { useState, useEffect } from 'react';
import api from '../services/api';

function BackupSettings() {
  const [settings, setSettings] = useState({
    enabled: false,
    frequency: 'daily',
    retention_days: 30,
    last_backup: null,
  });
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchSettings();
    fetchBackups();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/backup/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBackups = async () => {
    try {
      const response = await api.get('/backup/list');
      setBackups(response.data);
    } catch (error) {
      console.error('Error fetching backups:', error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await api.put('/backup/settings', settings);
      setMessage({ type: 'success', text: 'Settings saved successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    }
  };

  const handleCreateBackup = async () => {
    setCreating(true);
    setMessage({ type: '', text: '' });
    try {
      const response = await api.post('/backup/create');
      setMessage({ type: 'success', text: `Backup created: ${response.data.file}` });
      fetchBackups();
      fetchSettings();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create backup' });
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = async (filename) => {
    try {
      const response = await api.get(`/backup/download/${filename}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading backup:', error);
    }
  };

  const handleDelete = async (filename) => {
    if (window.confirm(`Are you sure you want to delete ${filename}?`)) {
      try {
        await api.delete(`/backup/${filename}`);
        fetchBackups();
      } catch (error) {
        console.error('Error deleting backup:', error);
      }
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Backup Settings</h2>

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

      {/* Backup Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-medium text-gray-800 mb-4">Configuration</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-700">Enable Automatic Backups</p>
              <p className="text-sm text-gray-500">Create backups automatically based on schedule</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
              <select
                value={settings.frequency}
                onChange={(e) => setSettings({ ...settings, frequency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Retention (days)</label>
              <input
                type="number"
                value={settings.retention_days}
                onChange={(e) => setSettings({ ...settings, retention_days: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                min="1"
                max="365"
              />
            </div>
          </div>

          {settings.last_backup && (
            <p className="text-sm text-gray-500">
              Last backup: {new Date(settings.last_backup).toLocaleString()}
            </p>
          )}

          <button
            onClick={handleSaveSettings}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Save Settings
          </button>
        </div>
      </div>

      {/* Manual Backup */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-800">Manual Backup</h3>
          <button
            onClick={handleCreateBackup}
            disabled={creating}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create Backup Now'}
          </button>
        </div>
        <p className="text-sm text-gray-600">
          Create an immediate backup of all your data. Backups include tickets, assets, users,
          knowledge base articles, and settings. Sensitive data (passwords, API keys) are redacted.
        </p>
      </div>

      {/* Backup List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-medium text-gray-800">Available Backups</h3>
        </div>
        {backups.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No backups yet</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Filename</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {backups.map((backup) => (
                <tr key={backup.name}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-700">
                    {backup.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatSize(backup.size)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(backup.created).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => handleDownload(backup.name)}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => handleDelete(backup.name)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Help */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">About Backups</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Backups include all your data: tickets, assets, users, and settings</li>
          <li>• Passwords and API keys are automatically redacted for security</li>
          <li>• Old backups are automatically deleted based on retention settings</li>
          <li>• You can download backups for safekeeping or migration</li>
        </ul>
      </div>
    </div>
  );
}

export default BackupSettings;
