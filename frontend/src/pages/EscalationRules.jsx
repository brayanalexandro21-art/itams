import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { IconoTitulo } from '../components/Icono';

const EscalationRules = () => {
  const [rules, setRules] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '', priority: 0, trigger_condition: '{ "priority": "high", "hours_open": 24 }',
    action_type: 'notify', target_role: 'manager', target_user: '', message: '', active: true
  });
  const [loading, setLoading] = useState(true);
  const [processResult, setProcessResult] = useState(null);

  useEffect(() => { fetchRules(); }, []);

  const fetchRules = async () => {
    try {
      const response = await api.get('/escalation-rules');
      setRules(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRule = async () => {
    try {
      const payload = { ...newRule, trigger_condition: newRule.trigger_condition };
      await api.post('/escalation-rules', payload);
      setShowCreate(false);
      setNewRule({ name: '', priority: 0, trigger_condition: '{ "priority": "high", "hours_open": 24 }', action_type: 'notify', target_role: 'manager', target_user: '', message: '', active: true });
      fetchRules();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const deleteRule = async (id) => {
    if (!confirm('¿Eliminar esta regla?')) return;
    try {
      await api.delete(`/escalation-rules/${id}`);
      fetchRules();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const toggleRule = async (id) => {
    try {
      await api.post(`/escalation-rules/${id}/toggle`);
      fetchRules();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const processRules = async () => {
    try {
      const response = await api.post('/escalation-rules/process');
      setProcessResult(response.data);
      fetchRules();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-3"><IconoTitulo e="⚡" />Reglas de Escalación</h1>
        <div className="flex gap-2">
          <button onClick={processRules} className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">
            Procesar Escalaciones
          </button>
          <button onClick={() => setShowCreate(!showCreate)} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            + Nueva Regla
          </button>
        </div>
      </div>

      {processResult && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800">
            Evaluadas {processResult.rules_evaluated} reglas → {processResult.tickets_escalated} tickets escalados
          </p>
        </div>
      )}

      {showCreate && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Crear Regla de Escalación</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input type="text" value={newRule.name} onChange={(e) => setNewRule({...newRule, name: e.target.value})} placeholder="Nombre de la regla" className="border rounded px-3 py-2" />
            <input type="number" value={newRule.priority} onChange={(e) => setNewRule({...newRule, priority: parseInt(e.target.value)})} placeholder="Prioridad (0=mayor)" className="border rounded px-3 py-2" />
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Condición trigger (JSON)</label>
              <textarea value={newRule.trigger_condition} onChange={(e) => setNewRule({...newRule, trigger_condition: e.target.value})} className="w-full border rounded px-3 py-2 font-mono text-sm h-20" />
            </div>
            <select value={newRule.action_type} onChange={(e) => setNewRule({...newRule, action_type: e.target.value})} className="border rounded px-3 py-2">
              <option value="notify">Notificar</option>
              <option value="reassign">Reasignar</option>
              <option value="set_priority">Cambiar prioridad</option>
              <option value="add_comment">Agregar comentario</option>
            </select>
            <input type="text" value={newRule.target_role} onChange={(e) => setNewRule({...newRule, target_role: e.target.value})} placeholder="Rol objetivo" className="border rounded px-3 py-2" />
            <textarea value={newRule.message} onChange={(e) => setNewRule({...newRule, message: e.target.value})} placeholder="Mensaje de escalación" className="border rounded px-3 py-2 col-span-2" rows={2} />
          </div>
          <div className="flex gap-2">
            <button onClick={createRule} className="bg-green-500 text-white px-4 py-2 rounded">Crear</button>
            <button onClick={() => setShowCreate(false)} className="bg-gray-300 px-4 py-2 rounded">Cancelar</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Regla</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Disparador</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rules.map(rule => (
              <tr key={rule.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium">{rule.name}</div>
                  <div className="text-xs text-gray-400">Prioridad: {rule.priority}</div>
                </td>
                <td className="px-6 py-4 text-xs font-mono text-gray-500 max-w-xs truncate">{rule.trigger_condition}</td>
                <td className="px-6 py-4 text-sm capitalize">{rule.action_type?.replace(/_/g, ' ')}</td>
                <td className="px-6 py-4">
                  <button onClick={() => toggleRule(rule.id)} className={`px-2 py-0.5 rounded text-xs ${rule.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {rule.active ? 'Activa' : 'Inactiva'}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => deleteRule(rule.id)} className="text-red-600 text-sm hover:underline">Eliminar</button>
                </td>
              </tr>
            ))}
            {rules.length === 0 && (
              <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">No hay reglas de escalación</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EscalationRules;