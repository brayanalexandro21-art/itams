import React, { useState, useEffect } from 'react';
import api from '../services/api';

const WebhookManagement = () => {
  const [webhooks, setWebhooks] = useState([]);
  const [selectedWebhook, setSelectedWebhook] = useState(null);
  const [logs, setLogs] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    name: '', url: '', events: [], secret: '', method: 'POST'
  });
  const [loading, setLoading] = useState(true);

  const EVENT_OPTIONS = [
    'ticket_created', 'ticket_updated', 'ticket_closed',
    'asset_created', 'asset_updated',
    'user_created', 'user_updated',
    'sla_breach', 'workflow_executed'
  ];

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const response = await api.get('/webhook-management');
      setWebhooks(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async (id) => {
    try {
      const response = await api.get(`/webhook-management/${id}/logs`);
      setLogs(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const createWebhook = async () => {
    try {
      await api.post('/webhook-management', newWebhook);
      setShowCreate(false);
      setNewWebhook({ name: '', url: '', events: [], secret: '', method: 'POST' });
      fetchWebhooks();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const deleteWebhook = async (id) => {
    if (!confirm('¿Eliminar este webhook?')) return;
    try {
      await api.delete(`/webhook-management/${id}`);
      setSelectedWebhook(null);
      fetchWebhooks();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const toggleWebhook = async (id) => {
    try {
      await api.post(`/webhook-management/${id}/toggle`);
      fetchWebhooks();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const testWebhook = async (id) => {
    try {
      await api.post(`/webhook-management/${id}/test`);
      alert('Test enviado');
      fetchLogs(id);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const toggleEvent = (event) => {
    const events = newWebhook.events.includes(event)
      ? newWebhook.events.filter(e => e !== event)
      : [...newWebhook.events, event];
    setNewWebhook({ ...newWebhook, events });
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🔗 Gestión de Webhooks</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          + Nuevo Webhook
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Crear Webhook</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input type="text" value={newWebhook.name} onChange={(e) => setNewWebhook({...newWebhook, name: e.target.value})} placeholder="Nombre" className="border rounded px-3 py-2" />
            <input type="text" value={newWebhook.url} onChange={(e) => setNewWebhook({...newWebhook, url: e.target.value})} placeholder="URL del webhook" className="border rounded px-3 py-2" />
            <input type="text" value={newWebhook.secret} onChange={(e) => setNewWebhook({...newWebhook, secret: e.target.value})} placeholder="Secret (opcional)" className="border rounded px-3 py-2" />
            <select value={newWebhook.method} onChange={(e) => setNewWebhook({...newWebhook, method: e.target.value})} className="border rounded px-3 py-2">
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Eventos</label>
            <div className="flex flex-wrap gap-2">
              {EVENT_OPTIONS.map(event => (
                <label key={event} className={`px-3 py-1 rounded text-sm cursor-pointer ${newWebhook.events.includes(event) ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
                  <input type="checkbox" className="hidden" checked={newWebhook.events.includes(event)} onChange={() => toggleEvent(event)} />
                  {event}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={createWebhook} className="bg-green-500 text-white px-4 py-2 rounded">Crear</button>
            <button onClick={() => setShowCreate(false)} className="bg-gray-300 px-4 py-2 rounded">Cancelar</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Webhooks</h2>
          <div className="space-y-2">
            {webhooks.map(wh => (
              <div
                key={wh.id}
                onClick={() => { setSelectedWebhook(wh); fetchLogs(wh.id); }}
                className={`p-3 rounded-lg cursor-pointer ${selectedWebhook?.id === wh.id ? 'bg-blue-100' : 'bg-gray-50 hover:bg-gray-100'}`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{wh.name}</span>
                  <span className={`w-2 h-2 rounded-full ${wh.active ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                </div>
                <div className="text-xs text-gray-500">{wh.trigger_count} ejecuciones</div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          {selectedWebhook ? (
            <>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-semibold">{selectedWebhook.name}</h2>
                  <p className="text-sm text-gray-500 font-mono">{selectedWebhook.url}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleWebhook(selectedWebhook.id)} className={`px-3 py-1 rounded text-sm ${selectedWebhook.active ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                    {selectedWebhook.active ? 'Desactivar' : 'Activar'}
                  </button>
                  <button onClick={() => testWebhook(selectedWebhook.id)} className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm">Probar</button>
                  <button onClick={() => deleteWebhook(selectedWebhook.id)} className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm">Eliminar</button>
                </div>
              </div>

              <div className="mb-4">
                <span className="text-sm text-gray-500">Método:</span> <span className="font-mono">{selectedWebhook.method}</span>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Últimas ejecuciones</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {logs.length > 0 ? logs.map((log, i) => (
                    <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                      <span>{log.event}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {log.status} ({log.response_code})
                      </span>
                      <span className="text-gray-400 text-xs">{new Date(log.executed_at).toLocaleString('es-CO')}</span>
                    </div>
                  )) : (
                    <div className="text-gray-400 text-sm">No hay ejecuciones</div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 py-12">Selecciona un webhook</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebhookManagement;