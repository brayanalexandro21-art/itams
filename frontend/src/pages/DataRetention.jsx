import React, { useState, useEffect } from 'react';
import api from '../services/api';

const DataRetention = () => {
  const [config, setConfig] = useState({ audit_logs_days: 365, notifications_days: 90, activity_logs_days: 180, email_logs_days: 90, api_logs_days: 30 });
  const [stats, setStats] = useState(null);
  const [cleaning, setCleaning] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/data-retention'),
      api.get('/data-retention/stats')
    ]).then(([configRes, statsRes]) => {
      setConfig(configRes.data);
      setStats(statsRes.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const saveConfig = async () => {
    try {
      await api.put('/data-retention', config);
      alert('Configuración guardada');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const runCleanup = async () => {
    if (!confirm('¿Ejecutar limpieza de datos? Esta acción eliminará registros antiguos.')) return;
    setCleaning(true);
    try {
      const response = await api.post('/data-retention/cleanup');
      setResult(response.data);
      api.get('/data-retention/stats').then(r => setStats(r.data));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setCleaning(false);
    }
  };

  const configs = [
    { key: 'audit_logs_days', label: 'Logs de Auditoría', icon: '📋', desc: 'Registros de acciones de usuarios' },
    { key: 'notifications_days', label: 'Notificaciones', icon: '🔔', desc: 'Notificaciones del sistema' },
    { key: 'activity_logs_days', label: 'Logs de Actividad', icon: '📊', desc: 'Historial de actividad de usuarios' },
    { key: 'email_logs_days', label: 'Logs de Email', icon: '📧', desc: 'Registros de envío de emails' },
    { key: 'api_logs_days', label: 'Logs de API', icon: '🌐', desc: 'Registros de peticiones API' },
  ];

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">🗄️ Retención de Datos</h1>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        {stats && configs.map(c => (
          <div key={c.key} className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl mb-1">{c.icon}</div>
            <p className="text-2xl font-bold">{(stats[c.key.replace('_days', '').replace('audit_logs', 'audit_logs').replace('activity_logs', 'activity_logs')] || stats[c.key.replace('_days', '')] || 0).toLocaleString()}</p>
            <p className="text-xs text-gray-500">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Configuración de Retención</h2>
        <div className="space-y-4">
          {configs.map(c => (
            <div key={c.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-xl">{c.icon}</span>
                <div>
                  <div className="font-medium text-sm">{c.label}</div>
                  <div className="text-xs text-gray-400">{c.desc}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="number" value={config[c.key]} onChange={(e) => setConfig({...config, [c.key]: parseInt(e.target.value)})} className="w-20 border rounded px-3 py-1 text-sm text-center" min={1} />
                <span className="text-sm text-gray-500">días</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={saveConfig} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Guardar</button>
          <button onClick={runCleanup} disabled={cleaning} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50">
            {cleaning ? 'Limpiando...' : 'Ejecutar Limpieza Ahora'}
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-medium text-green-800 mb-2">Limpieza Completada</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(result.results).map(([key, count]) => (
              <div key={key} className="text-center">
                <p className="text-lg font-bold text-green-700">{count}</p>
                <p className="text-xs text-gray-500">{key.replace(/_/g, ' ')}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-green-700 mt-2">Total eliminado: {result.total_deleted} registros</p>
        </div>
      )}
    </div>
  );
};

export default DataRetention;