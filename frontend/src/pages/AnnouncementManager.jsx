import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { IconoTitulo } from '../components/Icono';

const AnnouncementManager = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', message: '', type: 'info', priority: 'normal', expires_at: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAnnouncements(); }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await api.get('/announcement-manager');
      setAnnouncements(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAnnouncement = async () => {
    try {
      await api.post('/announcement-manager', newAnnouncement);
      setShowCreate(false);
      setNewAnnouncement({ title: '', message: '', type: 'info', priority: 'normal', expires_at: '' });
      fetchAnnouncements();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const deleteAnnouncement = async (id) => {
    if (!confirm('¿Eliminar este anuncio?')) return;
    try {
      await api.delete(`/announcement-manager/${id}`);
      fetchAnnouncements();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'info': return 'bg-blue-100 text-blue-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'success': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-3"><IconoTitulo e="📢" />Gestor de Anuncios</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          + Nuevo Anuncio
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Crear Anuncio</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input type="text" value={newAnnouncement.title} onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})} placeholder="Título" className="border rounded px-3 py-2 col-span-2" />
            <textarea value={newAnnouncement.message} onChange={(e) => setNewAnnouncement({...newAnnouncement, message: e.target.value})} placeholder="Mensaje" className="border rounded px-3 py-2 col-span-2 h-24" />
            <select value={newAnnouncement.type} onChange={(e) => setNewAnnouncement({...newAnnouncement, type: e.target.value})} className="border rounded px-3 py-2">
              <option value="info">Info</option>
              <option value="warning">Advertencia</option>
              <option value="error">Error</option>
              <option value="success">Éxito</option>
            </select>
            <select value={newAnnouncement.priority} onChange={(e) => setNewAnnouncement({...newAnnouncement, priority: e.target.value})} className="border rounded px-3 py-2">
              <option value="low">Baja</option>
              <option value="normal">Normal</option>
              <option value="high">Alta</option>
            </select>
            <input type="datetime-local" value={newAnnouncement.expires_at} onChange={(e) => setNewAnnouncement({...newAnnouncement, expires_at: e.target.value})} className="border rounded px-3 py-2" />
          </div>
          <div className="flex gap-2">
            <button onClick={createAnnouncement} className="bg-green-500 text-white px-4 py-2 rounded">Crear</button>
            <button onClick={() => setShowCreate(false)} className="bg-gray-300 px-4 py-2 rounded">Cancelar</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {announcements.map(a => (
          <div key={a.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold">{a.title}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs ${getTypeBadge(a.type)}`}>{a.type}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${getPriorityBadge(a.priority)}`}>{a.priority}</span>
                  {a.active ? <span className="w-2 h-2 bg-green-500 rounded-full"></span> : <span className="w-2 h-2 bg-gray-300 rounded-full"></span>}
                </div>
                <p className="text-gray-600 text-sm mb-2">{a.message}</p>
                <div className="text-xs text-gray-400">
                  Creado: {new Date(a.created_at).toLocaleString('es-CO')}
                  {a.expires_at && ` | Expira: ${new Date(a.expires_at).toLocaleString('es-CO')}`}
                </div>
              </div>
              <button onClick={() => deleteAnnouncement(a.id)} className="text-red-600 text-sm hover:underline ml-4">Eliminar</button>
            </div>
          </div>
        ))}
        {announcements.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">No hay anuncios</div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementManager;