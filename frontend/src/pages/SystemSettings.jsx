import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Icono, IconoTitulo } from '../components/Icono';

const SystemSettings = () => {
  const [userPrefs, setUserPrefs] = useState({ theme: 'light', language: 'es', timezone: 'America/Mexico_City', notifications_enabled: true, compact_mode: false });
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prefsRes, themesRes] = await Promise.all([
        api.get('/system-settings/user'),
        api.get('/system-settings/themes')
      ]);
      setUserPrefs(prefsRes.data);
      setThemes(themesRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePrefs = async () => {
    try {
      await api.put('/system-settings/user', userPrefs);
      alert('Configuración guardada');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-3"><IconoTitulo e="⚙️" />Configuración del Sistema</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tema */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Icono e="🎨" />Tema</h2>
          <div className="grid grid-cols-2 gap-3">
            {themes.map(theme => (
              <div
                key={theme.id}
                onClick={() => setUserPrefs({...userPrefs, theme: theme.id})}
                className={`p-4 rounded-lg cursor-pointer border-2 transition-all ${userPrefs.theme === theme.id ? 'border-blue-500' : 'border-gray-200 hover:border-gray-300'}`}
                style={{ backgroundColor: theme.bg }}
              >
                <div className="font-medium text-sm" style={{ color: theme.primary }}>{theme.name}</div>
                <div className="flex gap-1 mt-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: theme.primary }}></div>
                  <div className="w-4 h-4 rounded bg-gray-300"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Idioma y Zona */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Icono e="🌍" />Idioma y Zona</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Idioma</label>
              <select value={userPrefs.language} onChange={(e) => setUserPrefs({...userPrefs, language: e.target.value})} className="w-full border rounded px-3 py-2">
                <option value="es">Español</option>
                <option value="en">English</option>
                <option value="pt">Português</option>
                <option value="fr">Français</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zona Horaria</label>
              <select value={userPrefs.timezone} onChange={(e) => setUserPrefs({...userPrefs, timezone: e.target.value})} className="w-full border rounded px-3 py-2">
                <option value="America/Mexico_City">México (UTC-6)</option>
                <option value="America/Bogota">Colombia (UTC-5)</option>
                <option value="America/Buenos_Aires">Argentina (UTC-3)</option>
                <option value="Europe/Madrid">España (UTC+1)</option>
                <option value="America/New_York">New York (UTC-5)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notificaciones */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Icono e="🔔" />Notificaciones</h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span>Notificaciones por email</span>
              <div
                onClick={() => setUserPrefs({...userPrefs, notifications_enabled: !userPrefs.notifications_enabled})}
                className={`w-12 h-6 rounded-full cursor-pointer transition-colors ${userPrefs.notifications_enabled ? 'bg-blue-500' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transform transition-transform mt-0.5 ${userPrefs.notifications_enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </div>
            </label>
          </div>
        </div>

        {/* Modo compacto */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Icono e="📐" />Interfaz</h2>
          <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span>Modo compacto</span>
            <div
              onClick={() => setUserPrefs({...userPrefs, compact_mode: !userPrefs.compact_mode})}
              className={`w-12 h-6 rounded-full cursor-pointer transition-colors ${userPrefs.compact_mode ? 'bg-blue-500' : 'bg-gray-300'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transform transition-transform mt-0.5 ${userPrefs.compact_mode ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </div>
          </label>
        </div>
      </div>

      <div className="mt-6">
        <button onClick={savePrefs} className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">
          Guardar Configuración
        </button>
      </div>
    </div>
  );
};

export default SystemSettings;