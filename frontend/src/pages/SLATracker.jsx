import React, { useState, useEffect } from 'react';
import api from '../services/api';

const SLATracker = () => {
  const [ticketId, setTicketId] = useState('');
  const [tracking, setTracking] = useState(null);
  const [atRisk, setAtRisk] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchAtRisk(); }, []);

  const fetchAtRisk = async () => {
    try {
      const response = await api.get('/sla-tracker/at-risk');
      setAtRisk(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const trackTicket = async () => {
    if (!ticketId.trim()) return;
    setLoading(true);
    try {
      const response = await api.get(`/sla-tracker/ticket/${ticketId}`);
      setTracking(response.data);
    } catch (error) {
      console.error('Error:', error);
      setTracking(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'breached': return 'bg-red-100 text-red-800';
      case 'on_track': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">⏱️ Rastreador de SLA</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Buscar SLA de Ticket</h2>
        <div className="flex gap-2">
          <input type="text" value={ticketId} onChange={(e) => setTicketId(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && trackTicket()} placeholder="ID del ticket" className="border rounded px-4 py-2 flex-1" />
          <button onClick={trackTicket} disabled={loading} className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50">
            {loading ? 'Buscando...' : 'Rastrear'}
          </button>
        </div>
      </div>

      {tracking && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Ticket #{tracking.ticket_id}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-500">SLA</div>
              <div className="font-medium">{tracking.sla_name || 'Sin SLA'}</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-500">Tiempo transcurrido</div>
              <div className="font-bold text-xl">{tracking.elapsed_hours}h</div>
            </div>
            <div className={`text-center p-3 rounded ${tracking.sla_met ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="text-sm text-gray-500">Estado SLA</div>
              <div className={`font-bold ${tracking.sla_met ? 'text-green-600' : 'text-red-600'}`}>
                {tracking.sla_met ? '✓ Cumplido' : '✗ Violado'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">Respuesta</h3>
              <div className="text-sm">
                <span className="text-gray-500">Deadline:</span> {tracking.response.deadline ? new Date(tracking.response.deadline).toLocaleString() : 'N/A'}
              </div>
              <div className="mt-1">
                <span className={`px-2 py-0.5 rounded text-xs ${getStatusBadge(tracking.response.status)}`}>
                  {tracking.response.status === 'breached' ? 'Violado' : tracking.response.status === 'on_track' ? 'En tiempo' : 'Sin SLA'}
                </span>
              </div>
              {tracking.response.remaining_hours !== null && tracking.response.status === 'on_track' && (
                <div className="text-xs text-green-600 mt-1">{tracking.response.remaining_hours}h restantes</div>
              )}
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">Resolución</h3>
              <div className="text-sm">
                <span className="text-gray-500">Deadline:</span> {tracking.resolution.deadline ? new Date(tracking.resolution.deadline).toLocaleString() : 'N/A'}
              </div>
              <div className="mt-1">
                <span className={`px-2 py-0.5 rounded text-xs ${getStatusBadge(tracking.resolution.status)}`}>
                  {tracking.resolution.status === 'breached' ? 'Violado' : tracking.resolution.status === 'on_track' ? 'En tiempo' : 'Sin SLA'}
                </span>
              </div>
              {tracking.resolution.remaining_hours !== null && tracking.resolution.status === 'on_track' && (
                <div className="text-xs text-green-600 mt-1">{tracking.resolution.remaining_hours}h restantes</div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">⚠️ Tickets en Riesgo de SLA ({atRisk.length})</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prioridad</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Creado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {atRisk.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono">{t.id}</td>
                  <td className="px-4 py-3 text-sm">{t.title}</td>
                  <td className="px-4 py-3 text-sm capitalize">{t.priority}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800">{t.status}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{new Date(t.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SLATracker;