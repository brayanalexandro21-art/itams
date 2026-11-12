import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Icono, IconoTitulo } from '../components/Icono';

const SystemHealth = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealth = async () => {
    setRefreshing(true);
    try {
      const response = await api.get('/system-health');
      setHealth(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchHealth(); }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'critical': return '❌';
      default: return '❓';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'critical': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-3"><IconoTitulo e="🏥" />Salud del Sistema</h1>
        <button onClick={fetchHealth} disabled={refreshing} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50">
          {refreshing ? 'Verificando...' : 'Actualizar'}
        </button>
      </div>

      {/* Overall status */}
      <div className={`rounded-lg shadow p-6 mb-6 border-2 ${
        health?.status === 'healthy' ? 'bg-green-50 border-green-300' :
        health?.status === 'warning' ? 'bg-yellow-50 border-yellow-300' :
        'bg-red-50 border-red-300'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl"><Icono e={getStatusIcon(health?.status)} className="h-10 w-10" /></span>
            <div>
              <h2 className="text-xl font-bold capitalize">
                {health?.status === 'healthy' ? 'Todo Operativo' : health?.status === 'warning' ? 'Advertencias Detectadas' : 'Problemas Críticos'}
              </h2>
              <p className="text-sm text-gray-500">Última verificación: {health?.timestamp ? new Date(health.timestamp).toLocaleString('es-CO') : 'N/A'}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {health?.checks?.filter(c => c.status === 'healthy').length || 0}/{health?.checks?.length || 0}
            </div>
            <div className="text-xs text-gray-500">checks pasados</div>
          </div>
        </div>
      </div>

      {/* Individual checks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {health?.checks?.map((check, i) => (
          <div key={i} className={`rounded-lg border p-4 ${getStatusColor(check.status)}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{check.name}</span>
              <span className="text-lg"><Icono e={getStatusIcon(check.status)} className="h-5 w-5" /></span>
            </div>
            <p className="text-sm text-gray-600">{check.detail}</p>
            {check.latency && <p className="text-xs text-gray-400 mt-1">Latencia: {check.latency}</p>}
          </div>
        ))}
      </div>

      <div className="mt-6 bg-white rounded-lg shadow p-4 text-center text-sm text-gray-500">
        Health check endpoint: <code className="bg-gray-100 px-2 py-0.5 rounded">GET /api/system-health/ping</code>
      </div>
    </div>
  );
};

export default SystemHealth;