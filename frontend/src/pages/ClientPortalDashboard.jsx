import React, { useState, useEffect } from 'react';
import api from '../services/api';

const ClientPortalDashboard = () => {
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [filter, setFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newTicket, setNewTicket] = useState({ title: '', description: '', priority: 'medium', category: 'general' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      const url = filter ? `/client-portal-v2/my-tickets?status=${filter}` : '/client-portal-v2/my-tickets';
      const [statsRes, ticketsRes] = await Promise.all([
        api.get('/client-portal-v2/stats'),
        api.get(url)
      ]);
      setStats(statsRes.data);
      setTickets(ticketsRes.data.tickets);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTicket = async (id) => {
    try {
      const response = await api.get(`/client-portal-v2/my-tickets/${id}`);
      setSelectedTicket(response.data.ticket);
      setComments(response.data.comments);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const createTicket = async () => {
    try {
      await api.post('/client-portal-v2/create-ticket', newTicket);
      setShowCreate(false);
      setNewTicket({ title: '', description: '', priority: 'medium', category: 'general' });
      fetchData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    try {
      await api.post(`/client-portal-v2/my-tickets/${selectedTicket.id}/comment`, { content: newComment });
      setNewComment('');
      fetchTicket(selectedTicket.id);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getStatusColor = (s) => {
    switch (s) {
      case 'open': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🌐 Portal del Cliente</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          + Nuevo Ticket
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <h3 className="text-sm text-gray-500">Total</h3>
          <p className="text-2xl font-bold">{stats?.total || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <h3 className="text-sm text-gray-500">Abiertos</h3>
          <p className="text-2xl font-bold text-yellow-600">{stats?.open || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <h3 className="text-sm text-gray-500">En Progreso</h3>
          <p className="text-2xl font-bold text-blue-600">{stats?.in_progress || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <h3 className="text-sm text-gray-500">Resueltos</h3>
          <p className="text-2xl font-bold text-green-600">{stats?.resolved || 0}</p>
        </div>
      </div>

      {showCreate && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Crear Ticket</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input type="text" value={newTicket.title} onChange={(e) => setNewTicket({...newTicket, title: e.target.value})} placeholder="Asunto" className="border rounded px-3 py-2 col-span-2" />
            <textarea value={newTicket.description} onChange={(e) => setNewTicket({...newTicket, description: e.target.value})} placeholder="Descripción del problema" className="border rounded px-3 py-2 col-span-2 h-24" />
            <select value={newTicket.priority} onChange={(e) => setNewTicket({...newTicket, priority: e.target.value})} className="border rounded px-3 py-2">
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
            </select>
            <select value={newTicket.category} onChange={(e) => setNewTicket({...newTicket, category: e.target.value})} className="border rounded px-3 py-2">
              <option value="general">General</option>
              <option value="hardware">Hardware</option>
              <option value="software">Software</option>
              <option value="network">Red</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={createTicket} className="bg-green-500 text-white px-4 py-2 rounded">Crear</button>
            <button onClick={() => setShowCreate(false)} className="bg-gray-300 px-4 py-2 rounded">Cancelar</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full border rounded px-3 py-2 text-sm">
              <option value="">Todos</option>
              <option value="open">Abiertos</option>
              <option value="in_progress">En Progreso</option>
              <option value="resolved">Resueltos</option>
            </select>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {tickets.map(t => (
              <div key={t.id} onClick={() => fetchTicket(t.id)} className={`p-3 rounded-lg cursor-pointer ${selectedTicket?.id === t.id ? 'bg-blue-100' : 'bg-gray-50 hover:bg-gray-100'}`}>
                <div className="flex justify-between items-start">
                  <span className="font-medium text-sm">#{t.id} {t.title}</span>
                  <span className={`text-xs px-1 rounded ${getStatusColor(t.status)}`}>{t.status}</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">{new Date(t.created_at).toLocaleDateString('es-CO')}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          {selectedTicket ? (
            <>
              <div className="mb-4">
                <h2 className="text-lg font-semibold">#{selectedTicket.id} {selectedTicket.title}</h2>
                <div className="flex gap-3 mt-2 text-sm">
                  <span className={`px-2 py-0.5 rounded ${getStatusColor(selectedTicket.status)}`}>{selectedTicket.status}</span>
                  <span className="text-gray-500">{selectedTicket.priority}</span>
                  <span className="text-gray-400">{new Date(selectedTicket.created_at).toLocaleString('es-CO')}</span>
                </div>
                <p className="mt-3 text-gray-600">{selectedTicket.description}</p>
              </div>

              <div className="border-t pt-4 mb-4">
                <h3 className="font-medium mb-3">Comentarios ({comments.length})</h3>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {comments.map((c, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-sm">{c.user_name}</span>
                        <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleString('es-CO')}</span>
                      </div>
                      <p className="text-sm text-gray-600">{c.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 flex gap-2">
                <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addComment()} placeholder="Escribe un comentario..." className="flex-1 border rounded px-3 py-2 text-sm" />
                <button onClick={addComment} className="bg-blue-500 text-white px-4 py-2 rounded text-sm">Enviar</button>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 py-12">Selecciona un ticket para ver detalles</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientPortalDashboard;