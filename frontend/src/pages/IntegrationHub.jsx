import React, { useState, useEffect } from 'react';
import api from '../services/api';

const IntegrationHub = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const response = await api.get('/integration-hub/dashboard');
      setData(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleIntegration = async (id) => {
    try {
      await api.post(`/integration-hub/${id}/toggle`);
      fetchData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const testIntegration = async (id) => {
    try {
      await api.post(`/integration-hub/${id}/test`);
      alert('Test exitoso');
      fetchData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">🔌 Centro de Integraciones</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <h3 className="text-sm text-gray-500">Total</h3>
          <p className="text-2xl font-bold">{data?.stats?.total || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <h3 className="text-sm text-gray-500">Activas</h3>
          <p className="text-2xl font-bold text-green-600">{data?.stats?.active || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <h3 className="text-sm text-gray-500">Errores Hoy</h3>
          <p className={`text-2xl font-bold ${(data?.stats?.failed_today || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>{data?.stats?.failed_today || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <h3 className="text-sm text-gray-500">Registros totales</h3>
          <p className="text-2xl font-bold">{data?.stats?.total_logs || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {data?.integrations?.map(int => (
          <div key={int.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold">{int.name}</h3>
                <p className="text-xs text-gray-400 capitalize">{int.type || int.integration_type}</p>
              </div>
              <div className={`w-3 h-3 rounded-full ${int.active ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => toggleIntegration(int.id)} className={`flex-1 px-3 py-1 rounded text-sm ${int.active ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                {int.active ? 'Desactivar' : 'Activar'}
              </button>
              <button onClick={() => testIntegration(int.id)} className="flex-1 px-3 py-1 rounded text-sm bg-blue-100 text-blue-800">Probar</button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">📜 Registros recientes</h2>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {data?.logs?.map((log, i) => (
            <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
              <div>
                <span className="font-medium">{log.integration_name || 'N/A'}</span>
                <span className="text-gray-500 ml-2">{log.message}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs ${log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{log.status}</span>
                <span className="text-xs text-gray-400">{new Date(log.executed_at).toLocaleString('es-CO')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IntegrationHub;