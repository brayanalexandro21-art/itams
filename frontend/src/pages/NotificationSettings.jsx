import React, { useState, useEffect } from 'react';
import api from '../services/api';

const NotificationSettings = () => {
  const [channels, setChannels] = useState([]);
  const [preferences, setPreferences] = useState({
    email_enabled: true,
    push_enabled: true,
    ticket_created: true,
    ticket_updated: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchChannels();
    fetchPreferences();
  }, []);

  const fetchChannels = async () => {
    try {
      const response = await api.get('/notifications/channels');
      setChannels(response.data);
    } catch (error) {
      console.error('Error fetching channels:', error);
    }
  };

  const fetchPreferences = async () => {
    try {
      const response = await api.get('/notifications/preferences');
      setPreferences(response.data);
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  };

  const savePreferences = async () => {
    setLoading(true);
    try {
      await api.put('/notifications/preferences', preferences);
      alert('Preferencias guardadas');
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Configuración de Notificaciones</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Preferencias</h2>
        
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={preferences.email_enabled}
              onChange={(e) => setPreferences({...preferences, email_enabled: e.target.checked})}
              className="w-5 h-5"
            />
            <span>Notificaciones por email</span>
          </label>
          
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={preferences.push_enabled}
              onChange={(e) => setPreferences({...preferences, push_enabled: e.target.checked})}
              className="w-5 h-5"
            />
            <span>Notificaciones push</span>
          </label>
          
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={preferences.ticket_created}
              onChange={(e) => setPreferences({...preferences, ticket_created: e.target.checked})}
              className="w-5 h-5"
            />
            <span>Notificar al crear ticket</span>
          </label>
          
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={preferences.ticket_updated}
              onChange={(e) => setPreferences({...preferences, ticket_updated: e.target.checked})}
              className="w-5 h-5"
            />
            <span>Notificar al actualizar ticket</span>
          </label>
        </div>

        <button
          onClick={savePreferences}
          disabled={loading}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar Preferencias'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Canales de Notificación</h2>
        {channels.length > 0 ? (
          <div className="space-y-3">
            {channels.map((channel, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">{channel.name}</span>
                  <span className="text-sm text-gray-500 ml-2">({channel.type})</span>
                </div>
                <span className={`px-2 py-1 rounded text-sm ${channel.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {channel.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-4">
            No hay canales configurados
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationSettings;
