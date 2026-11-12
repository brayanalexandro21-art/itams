import React, { useState, useEffect } from 'react';
import api from '../services/api';

const AdvancedDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get('/advanced-analytics/dashboard-v3');
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
      <h1 className="text-2xl font-bold mb-6">📊 Dashboard Avanzado V3</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm text-gray-500">Tickets Totales</h3>
          <p className="text-2xl font-bold">{data?.tickets?.total || 0}</p>
          <div className="text-xs text-green-600">+{data?.tickets?.open || 0} abiertos</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm text-gray-500">Activos</h3>
          <p className="text-2xl font-bold">{data?.assets?.total || 0}</p>
          <div className="text-xs text-blue-600">{data?.assets?.inUse || 0} en uso</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm text-gray-500">Usuarios</h3>
          <p className="text-2xl font-bold">{data?.users?.total || 0}</p>
          <div className="text-xs text-green-600">{data?.users?.active || 0} activos</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm text-gray-500">Actividad Reciente</h3>
          <p className="text-2xl font-bold">{data?.recentActivity?.length || 0}</p>
          <div className="text-xs text-gray-500">últimas acciones</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Tickets por prioridad */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Tickets por Prioridad</h2>
          <div className="space-y-2">
            {data?.tickets?.byPriority?.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-20 text-sm">{item.priority}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-4">
                  <div 
                    className="h-4 rounded-full bg-blue-500" 
                    style={{ width: `${(item.count / data.tickets.total) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tickets por categoría */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Tickets por Categoría</h2>
          <div className="space-y-2">
            {data?.tickets?.byCategory?.slice(0, 5).map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-24 text-sm truncate">{item.category}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-4">
                  <div 
                    className="h-4 rounded-full bg-green-500" 
                    style={{ width: `${(item.count / data.tickets.total) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actividad reciente */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Actividad Reciente</h2>
        <div className="space-y-3">
          {data?.recentActivity?.slice(0, 5).map((activity, i) => (
            <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
              <span className="text-lg">
                {activity.action === 'create' ? '➕' : 
                 activity.action === 'update' ? '✏️' : 
                 activity.action === 'delete' ? '🗑️' : '📌'}
              </span>
              <div className="flex-1">
                <span className="font-medium">{activity.action}</span>
                <span className="text-gray-500 ml-2">{activity.entity_type}</span>
              </div>
              <span className="text-xs text-gray-400">
                {new Date(activity.created_at).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdvancedDashboard;