import React, { useState, useEffect } from 'react';
import api from '../services/api';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState({ type: '', read: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.type) params.append('type', filter.type);
      if (filter.read) params.append('read', filter.read);

      const [notifRes, statsRes] = await Promise.all([
        api.get(`/notification-center?${params}`),
        api.get('/notification-center/stats')
      ]);
      setNotifications(notifRes.data.notifications);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.post(`/notification-center/${id}/read`);
      fetchData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const markAllRead = async () => {
    try {
      await api.post('/notification-center/read-all');
      fetchData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notification-center/${id}`);
      fetchData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'ticket': return '🎫';
      case 'system': return '⚙️';
      case 'mention': return '💬';
      case 'assignment': return '👤';
      case 'sla': return '⏱️';
      default: return '🔔';
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🔔 Centro de Notificaciones</h1>
        {stats?.unread > 0 && (
          <button onClick={markAllRead} className="text-blue-600 hover:underline text-sm">
            Marcar todas como leídas ({stats.unread})
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <h3 className="text-sm text-gray-500">Total</h3>
          <p className="text-2xl font-bold">{stats?.total || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <h3 className="text-sm text-gray-500">No leídas</h3>
          <p className="text-2xl font-bold text-red-600">{stats?.unread || 0}</p>
        </div>
        {stats?.byType?.slice(0, 2).map((t, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-4 text-center">
            <h3 className="text-sm text-gray-500 capitalize">{t.type}</h3>
            <p className="text-2xl font-bold">{t.count}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4">
          <select value={filter.type} onChange={(e) => setFilter({...filter, type: e.target.value})} className="border rounded px-3 py-2 text-sm">
            <option value="">Todos los tipos</option>
            <option value="ticket">Tickets</option>
            <option value="system">Sistema</option>
            <option value="mention">Menciones</option>
            <option value="assignment">Asignaciones</option>
            <option value="sla">SLA</option>
          </select>
          <select value={filter.read} onChange={(e) => setFilter({...filter, read: e.target.value})} className="border rounded px-3 py-2 text-sm">
            <option value="">Todas</option>
            <option value="false">No leídas</option>
            <option value="true">Leídas</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="divide-y">
          {notifications.length > 0 ? notifications.map(n => (
            <div key={n.id} className={`p-4 flex items-start gap-3 ${n.is_read ? 'bg-white' : 'bg-blue-50'}`}>
              <span className="text-xl mt-1">{getTypeIcon(n.type)}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-sm">{n.title}</h3>
                  {!n.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
                </div>
                <p className="text-sm text-gray-600">{n.message}</p>
                <span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</span>
              </div>
              <div className="flex gap-2">
                {!n.is_read && (
                  <button onClick={() => markAsRead(n.id)} className="text-blue-600 text-xs hover:underline">Leer</button>
                )}
                <button onClick={() => deleteNotification(n.id)} className="text-red-500 text-xs hover:underline">Eliminar</button>
              </div>
            </div>
          )) : (
            <div className="p-8 text-center text-gray-400">No hay notificaciones</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;