import React, { useState, useEffect } from 'react';
import api from '../services/api';

const ApiUsageAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get('/api-usage-analytics/dashboard');
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
      <h1 className="text-2xl font-bold mb-6">📊 Uso de API</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <h3 className="text-sm text-gray-500">Solicitudes totales</h3>
          <p className="text-2xl font-bold">{data?.summary?.total?.toLocaleString('es-CO') || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <h3 className="text-sm text-gray-500">Hoy</h3>
          <p className="text-2xl font-bold text-blue-600">{data?.summary?.today?.toLocaleString('es-CO') || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <h3 className="text-sm text-gray-500">Tiempo Prom.</h3>
          <p className="text-2xl font-bold">{data?.summary?.avg_response_ms || 0}ms</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <h3 className="text-sm text-gray-500">Tasa de error</h3>
          <p className={`text-2xl font-bold ${data?.summary?.error_rate > 5 ? 'text-red-600' : 'text-green-600'}`}>
            {data?.summary?.error_rate || 0}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Por Endpoint</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {data?.byEndpoint?.map((ep, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                <span className="font-mono truncate flex-1">{ep.endpoint}</span>
                <div className="flex gap-4 ml-4">
                  <span className="text-gray-500">{ep.count} req</span>
                  <span className="text-gray-400">{Math.round(ep.avg_time || 0)}ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Por Método</h2>
          <div className="space-y-3">
            {data?.byMethod?.map((m, i) => {
              const colors = { GET: 'bg-blue-500', POST: 'bg-green-500', PUT: 'bg-yellow-500', DELETE: 'bg-red-500' };
              const total = data.byMethod.reduce((s, x) => s + x.count, 0);
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-mono">{m.method}</span>
                    <span>{m.count} ({total > 0 ? Math.round((m.count / total) * 100) : 0}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div className={`${colors[m.method] || 'bg-gray-500'} h-4 rounded-full`} style={{ width: `${total > 0 ? (m.count / total) * 100 : 0}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Tráfico por Hora (24h)</h2>
          <div className="flex items-end gap-1 h-40">
            {Array.from({ length: 24 }, (_, i) => {
              const hourData = data?.byHour?.find(h => parseInt(h.hour) === i);
              const count = hourData?.count || 0;
              const maxCount = Math.max(...(data?.byHour?.map(h => h.count) || [1]));
              return (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-blue-500 rounded-t" style={{ height: `${(count / maxCount) * 100}%`, minHeight: count > 0 ? '4px' : '0' }} />
                  <span className="text-xs text-gray-400 mt-1">{i}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Top Usuarios</h2>
          <div className="space-y-2">
            {data?.topUsers?.map((u, i) => (
              <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                <span>{u.name || 'Anónimo'}</span>
                <span className="font-bold">{u.request_count} req</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiUsageAnalytics;