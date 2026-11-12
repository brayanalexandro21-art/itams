import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Icono, IconoTitulo } from '../components/Icono';

const SystemPerformance = () => {
  const [data, setData] = useState(null);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dashRes, tablesRes] = await Promise.all([
        api.get('/system-performance/dashboard'),
        api.get('/system-performance/tables')
      ]);
      setData(dashRes.data);
      setTables(tablesRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const optimize = async () => {
    try {
      await api.post('/system-performance/optimize');
      alert('Base de datos optimizada');
      fetchData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const formatUptime = (seconds) => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-3"><IconoTitulo e="⚙️" />Rendimiento del Sistema</h1>
        <button onClick={optimize} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Optimizar DB
        </button>
      </div>

      {/* System info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm text-gray-500">Uptime</h3>
          <p className="text-xl font-bold">{formatUptime(data?.system?.uptime || 0)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm text-gray-500">Memoria RSS</h3>
          <p className="text-xl font-bold">{data?.system?.memory_mb || 0} MB</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm text-gray-500">Heap</h3>
          <p className="text-xl font-bold">{data?.system?.heap_mb || 0} MB</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm text-gray-500">Tablas DB</h3>
          <p className="text-xl font-bold">{data?.database?.tables || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Records per table */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Icono e="📊" />Registros por Tabla</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {tables.sort((a, b) => b.records - a.records).map((t, i) => (
              <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm font-mono">{t.name}</span>
                <span className="text-sm font-bold">{t.records.toLocaleString('es-CO')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* API stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Icono e="🌐" />API Stats (24h)</h2>
          {data?.apiStats?.length > 0 ? (
            <div className="space-y-2">
              {data.apiStats.map((stat, i) => (
                <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                  <span className="font-mono truncate">{stat.endpoint}</span>
                  <div className="flex gap-4">
                    <span>{stat.count} req</span>
                    <span>{Math.round(stat.avg_time || 0)}ms</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">Sin datos de API</p>
          )}
        </div>
      </div>

      {/* Recent errors */}
      {data?.recentErrors?.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Icono e="⚠️" />Errores Recientes</h2>
          <div className="space-y-2">
            {data.recentErrors.map((err, i) => (
              <div key={i} className="p-2 bg-red-50 rounded text-sm">
                <span className="font-medium">{err.action}</span>
                <span className="text-gray-500 ml-2">{new Date(err.created_at).toLocaleString('es-CO')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemPerformance;