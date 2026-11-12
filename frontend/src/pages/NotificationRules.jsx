import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Icono, IconoTitulo } from '../components/Icono';

const NotificationRules = () => {
  const [rules, setRules] = useState([]);
  const [types, setTypes] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newRule, setNewRule] = useState({ name: '', channel_type: 'email', config: { webhook_url: '', bot_token: '' }, events: ['ticket_created'], active: true });
  const [loading, setLoading] = useState(true);

  const EVENT_OPTIONS = ['ticket_created', 'ticket_updated', 'ticket_assigned', 'ticket_resolved', 'sla_breach', 'asset_created', 'user_created', 'workflow_executed'];

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [rulesRes, typesRes] = await Promise.all([
        api.get('/notification-rules'),
        api.get('/notification-rules/types')
      ]);
      setRules(rulesRes.data);
      setTypes(typesRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRule = async () => {
    try {
      await api.post('/notification-rules', newRule);
      setShowCreate(false);
      setNewRule({ name: '', channel_type: 'email', config: {}, events: ['ticket_created'], active: true });
      fetchData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const deleteRule = async (id) => {
    if (!confirm('¿Eliminar esta regla?')) return;
    try {
      await api.delete(`/notification-rules/${id}`);
      fetchData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const toggleEvent = (event) => {
    const events = newRule.events.includes(event) ? newRule.events.filter(e => e !== event) : [...newRule.events, event];
    setNewRule({ ...newRule, events });
  };

  const getTypeIcon = (type) => types.find(t => t.type === type)?.icon || '🔔';

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-3"><IconoTitulo e="🔔" />Reglas de Notificación</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          + Nueva Regla
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Crear Regla</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input type="text" value={newRule.name} onChange={(e) => setNewRule({...newRule, name: e.target.value})} placeholder="Nombre" className="border rounded px-3 py-2" />
            <select value={newRule.channel_type} onChange={(e) => setNewRule({...newRule, channel_type: e.target.value})} className="border rounded px-3 py-2">
              {types.map(t => <option key={t.type} value={t.type}>{t.name}</option>)}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Eventos</label>
            <div className="flex flex-wrap gap-2">
              {EVENT_OPTIONS.map(event => (
                <label key={event} className={`px-3 py-1 rounded text-sm cursor-pointer ${newRule.events.includes(event) ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
                  <input type="checkbox" className="hidden" checked={newRule.events.includes(event)} onChange={() => toggleEvent(event)} />
                  {event.replace(/_/g, ' ')}
                </label>
              ))}
            </div>
          </div>
          {newRule.channel_type === 'webhook' && (
            <input type="text" value={newRule.config.webhook_url || ''} onChange={(e) => setNewRule({...newRule, config: {...newRule.config, webhook_url: e.target.value}})} placeholder="URL del webhook" className="w-full border rounded px-3 py-2 mb-4" />
          )}
          <div className="flex gap-2">
            <button onClick={createRule} className="bg-green-500 text-white px-4 py-2 rounded">Crear</button>
            <button onClick={() => setShowCreate(false)} className="bg-gray-300 px-4 py-2 rounded">Cancelar</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rules.map(rule => (
          <div key={rule.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <span><Icono e={getTypeIcon(rule.channel_type)} className="h-5 w-5" /></span> {rule.name}
                </h3>
                <p className="text-xs text-gray-400 capitalize">{rule.channel_type}</p>
              </div>
              <div className={`w-3 h-3 rounded-full ${rule.active ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            </div>
            <div className="mb-3">
              <div className="flex flex-wrap gap-1">
                {(rule.events ? JSON.parse(rule.events || '[]') : []).map((ev, i) => (
                  <span key={i} className="px-2 py-0.5 bg-gray-100 rounded text-xs">{ev.replace(/_/g, ' ')}</span>
                ))}
              </div>
            </div>
            <button onClick={() => deleteRule(rule.id)} className="text-red-600 text-sm hover:underline">Eliminar</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationRules;