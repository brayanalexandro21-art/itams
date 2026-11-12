import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Icono } from '../components/Icono';

const UserActivity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await api.get('/user-activity/history');
      setActivities(response.data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'create': return '➕';
      case 'update': return '✏️';
      case 'delete': return '🗑️';
      case 'login': return '🔑';
      case 'logout': return '🚪';
      default: return '📌';
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Historial de Actividad</h1>

      <div className="bg-white rounded-lg shadow">
        {activities.length > 0 ? (
          <div className="divide-y">
            {activities.map((activity, index) => (
              <div key={index} className="p-4 flex items-center gap-3">
                <span className="text-xl"><Icono e={getActionIcon(activity.action)} className="h-6 w-6" /></span>
                <div className="flex-1">
                  <p className="font-medium">{activity.action}</p>
                  <p className="text-sm text-gray-500">{activity.entity_type} - {activity.entity_id}</p>
                  {activity.details && (
                    <p className="text-sm text-gray-400">{activity.details}</p>
                  )}
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(activity.created_at).toLocaleString('es-CO')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            No hay actividad registrada
          </div>
        )}
      </div>
    </div>
  );
};

export default UserActivity;