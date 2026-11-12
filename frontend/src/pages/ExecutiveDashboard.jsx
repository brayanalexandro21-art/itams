import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Icono, IconoTitulo } from '../components/Icono';

const ExecutiveDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get('/advanced-reporting/executive');
      setData(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-3"><IconoTitulo e="📊" />Dashboard Ejecutivo</h1>

      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm text-gray-500">Tickets</h3>
          <p className="text-2xl font-bold">{data?.summary?.total_tickets || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm text-gray-500">Activos</h3>
          <p className="text-2xl font-bold">{data?.summary?.total_assets || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm text-gray-500">Usuarios</h3>
          <p className="text-2xl font-bold">{data?.summary?.total_users || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm text-gray-500">Cumplimiento SLA</h3>
          <p className="text-2xl font-bold">{data?.summary?.sla_compliance || 0}%</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm text-gray-500">Tiempo Resolución</h3>
          <p className="text-2xl font-bold">{data?.summary?.avg_resolution_time || 0}d</p>
        </div>
      </div>

      {/* Tendencias */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Icono e="📈" />Tendencias</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold">{data?.trends?.tickets_this_week || 0}</p>
            <p className="text-sm text-gray-500">Esta semana</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{data?.trends?.tickets_last_week || 0}</p>
            <p className="text-sm text-gray-500">Semana anterior</p>
          </div>
          <div className="text-center">
            <p className={`text-3xl font-bold ${data?.trends?.growth_rate > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {data?.trends?.growth_rate > 0 ? '+' : ''}{data?.trends?.growth_rate || 0}%
            </p>
            <p className="text-sm text-gray-500">Crecimiento</p>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {data?.alerts?.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Icono e="🚨" />Alertas</h2>
          <div className="space-y-2">
            {data.alerts.map((alert, i) => (
              <div key={i} className={`p-3 rounded-lg ${
                alert.type === 'critical' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
              }`}>
                {alert.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutiveDashboard;