import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { IconoTitulo } from '../components/Icono';

const NotificationPreferencesAdvanced = () => {
  const [prefs, setPrefs] = useState({
    email_enabled: true,
    push_enabled: true,
    ticket_created: true,
    ticket_updated: true,
    ticket_assigned: true,
    ticket_resolved: true,
    asset_created: true,
    sla_warning: true,
    sla_breach: true,
    daily_digest: false,
    weekly_report: true,
    quiet_hours_start: '22:00',
    quiet_hours_end: '07:00',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPrefs();
  }, []);

  const fetchPrefs = async () => {
    try {
      const response = await api.get('/notification-prefs/detailed');
      setPrefs(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const savePrefs = async () => {
    setLoading(true);
    try {
      await api.put('/notification-prefs/detailed', prefs);
      alert('Preferencias guardadas');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const ToggleSwitch = ({ label, checked, onChange }) => (
    <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <span>{label}</span>
      <div
        onClick={() => onChange(!checked)}
        className={`w-12 h-6 rounded-full cursor-pointer transition-colors ${checked ? 'bg-blue-500' : 'bg-gray-300'}`}
      >
        <div className={`w-5 h-5 bg-white rounded-full transform transition-transform mt-0.5 ${checked ? 'translate-x-6' : 'translate-x-0.5'}`} />
      </div>
    </label>
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-3"><IconoTitulo e="📧" />Preferencias de Notificación</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Canales */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Canales</h2>
          <div className="space-y-2">
            <ToggleSwitch
              label="Notificaciones por email"
              checked={prefs.email_enabled}
              onChange={(v) => setPrefs({...prefs, email_enabled: v})}
            />
            <ToggleSwitch
              label="Notificaciones push"
              checked={prefs.push_enabled}
              onChange={(v) => setPrefs({...prefs, push_enabled: v})}
            />
          </div>
        </div>

        {/* Tickets */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Tickets</h2>
          <div className="space-y-2">
            <ToggleSwitch
              label="Ticket creado"
              checked={prefs.ticket_created}
              onChange={(v) => setPrefs({...prefs, ticket_created: v})}
            />
            <ToggleSwitch
              label="Ticket actualizado"
              checked={prefs.ticket_updated}
              onChange={(v) => setPrefs({...prefs, ticket_updated: v})}
            />
            <ToggleSwitch
              label="Ticket asignado"
              checked={prefs.ticket_assigned}
              onChange={(v) => setPrefs({...prefs, ticket_assigned: v})}
            />
            <ToggleSwitch
              label="Ticket resuelto"
              checked={prefs.ticket_resolved}
              onChange={(v) => setPrefs({...prefs, ticket_resolved: v})}
            />
          </div>
        </div>

        {/* SLA y Sistema */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">SLA y Sistema</h2>
          <div className="space-y-2">
            <ToggleSwitch
              label="Alerta de SLA"
              checked={prefs.sla_warning}
              onChange={(v) => setPrefs({...prefs, sla_warning: v})}
            />
            <ToggleSwitch
              label="Violación de SLA"
              checked={prefs.sla_breach}
              onChange={(v) => setPrefs({...prefs, sla_breach: v})}
            />
            <ToggleSwitch
              label="Resumen diario"
              checked={prefs.daily_digest}
              onChange={(v) => setPrefs({...prefs, daily_digest: v})}
            />
            <ToggleSwitch
              label="Reporte semanal"
              checked={prefs.weekly_report}
              onChange={(v) => setPrefs({...prefs, weekly_report: v})}
            />
          </div>
        </div>

        {/* Horas quietas */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Horas Quietas</h2>
          <p className="text-sm text-gray-500 mb-4">No recibir notificaciones durante este horario</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Inicio</label>
              <input
                type="time"
                value={prefs.quiet_hours_start}
                onChange={(e) => setPrefs({...prefs, quiet_hours_start: e.target.value})}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fin</label>
              <input
                type="time"
                value={prefs.quiet_hours_end}
                onChange={(e) => setPrefs({...prefs, quiet_hours_end: e.target.value})}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={savePrefs}
          disabled={loading}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar Preferencias'}
        </button>
      </div>
    </div>
  );
};

export default NotificationPreferencesAdvanced;