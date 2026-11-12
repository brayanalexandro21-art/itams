import React, { useState, useEffect } from 'react';
import api from '../services/api';

const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState(null);
  const [dbStats, setDbStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [metricsRes, dbRes] = await Promise.all([
        api.get('/performance-monitor/system'),
        api.get('/performance-monitor/database')
      ]);
      setMetrics(metricsRes.data);
      setDbStats(dbRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Monitor de Rendimiento</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Uptime</h3>
          <p className="text-2xl font-bold">
            {metrics ? Math.floor(metrics.uptime / 3600) + 'h ' + Math.floor((metrics.uptime % 3600) / 60) + 'm' : '-'}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Memoria RSS</h3>
          <p className="text-2xl font-bold">
            {metrics ? formatBytes(metrics.memory.rss) : '-'}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Heap Usado</h3>
          <p className="text-2xl font-bold">
            {metrics ? formatBytes(metrics.memory.heapUsed) : '-'}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Registros</h3>
          <p className="text-2xl font-bold">
            {dbStats ? dbStats.total_records.toLocaleString() : '-'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Estadísticas de Tablas</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Tabla</th>
                <th className="text-right py-2">Registros</th>
              </tr>
            </thead>
            <tbody>
              {dbStats?.tables.map((table, index) => (
                <tr key={index} className="border-b">
                  <td className="py-2">{table.table}</td>
                  <td className="text-right">{table.count.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;