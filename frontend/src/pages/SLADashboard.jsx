import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { IconoTitulo } from '../components/Icono';

const SLADashboard = () => {
  const [data, setData] = useState(null);
  const [slas, setSlas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dashRes, slasRes] = await Promise.all([
        api.get('/sla-dashboard/dashboard'),
        api.get('/sla-dashboard')
      ]);
      setData(dashRes.data);
      setSlas(slasRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-3"><IconoTitulo e="⏱️" />Dashboard de SLA</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <h3 className="text-sm text-gray-500">Cumplimiento SLA</h3>
          <p className={`text-3xl font-bold ${data?.summary?.compliance_rate >= 90 ? 'text-green-600' : data?.summary?.compliance_rate >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
            {data?.summary?.compliance_rate || 0}%
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <h3 className="text-sm text-gray-500">Cumplidos</h3>
          <p className="text-3xl font-bold text-green-600">{data?.summary?.met || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <h3 className="text-sm text-gray-500">Violaciones</h3>
          <p className="text-3xl font-bold text-red-600">{data?.summary?.breached || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <h3 className="text-sm text-gray-500">Tiempo Prom. Resolución</h3>
          <p className="text-3xl font-bold">{data?.avg_resolution_days || 0}d</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Por Prioridad</h2>
          <div className="space-y-3">
            {data?.byPriority?.map((p, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="capitalize font-medium">{p.priority}</span>
                  <span>{p.total > 0 ? Math.round((p.met / p.total) * 100) : 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 flex overflow-hidden">
                  <div className="bg-green-500 h-4" style={{ width: `${p.total > 0 ? (p.met / p.total) * 100 : 0}%` }} />
                  <div className="bg-red-400 h-4" style={{ width: `${p.total > 0 ? (p.breached / p.total) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Por Técnico</h2>
          <div className="space-y-2">
            {data?.byTechnician?.map((t, i) => (
              <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium">{t.name}</span>
                <span className={`px-2 py-1 rounded text-xs ${t.compliance_rate >= 90 ? 'bg-green-100 text-green-800' : t.compliance_rate >= 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                  {t.compliance_rate}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Violaciones Recientes</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {data?.recentBreaches?.map((b, i) => (
              <div key={i} className="p-3 bg-red-50 rounded text-sm">
                <div className="font-medium">#{b.id} {b.title}</div>
                <div className="text-xs text-gray-500">{b.assigned_to} — {new Date(b.created_at).toLocaleDateString('es-CO')}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Configuración SLA</h2>
          <div className="space-y-2">
            {slas.map((sla, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">{sla.name}</span>
                  <span className={`text-xs ${sla.active ? 'text-green-600' : 'text-gray-400'}`}>
                    {sla.active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Respuesta: {sla.response_time_hours}h | Resolución: {sla.resolution_time_hours}h
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SLADashboard;