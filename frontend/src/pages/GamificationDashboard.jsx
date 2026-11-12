import React, { useState, useEffect } from 'react';
import api from '../services/api';

const GamificationDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get('/gamification-management/dashboard');
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
      <h1 className="text-2xl font-bold mb-6">🏆 Gamificación</h1>

      {/* Stats del usuario */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg shadow p-6 text-white">
          <h3 className="text-sm opacity-80">Nivel</h3>
          <p className="text-4xl font-bold">{data?.user?.level || 1}</p>
          <div className="mt-2 w-full bg-white/20 rounded-full h-2">
            <div className="bg-white h-2 rounded-full" style={{ width: `${((data?.user?.total_points || 0) % 100)}%` }} />
          </div>
          <p className="text-xs opacity-70 mt-1">{(data?.user?.total_points || 0) % 100}/100 al siguiente nivel</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg shadow p-6 text-white">
          <h3 className="text-sm opacity-80">Puntos Totales</h3>
          <p className="text-4xl font-bold">{data?.user?.total_points || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-lg shadow p-6 text-white">
          <h3 className="text-sm opacity-80">Insignias</h3>
          <p className="text-4xl font-bold">{data?.badges?.length || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Insignias del usuario */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">🏅 Mis Insignias</h2>
          {data?.badges?.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {data.badges.map((badge, i) => (
                <div key={i} className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-3xl mb-1">{badge.icon}</div>
                  <div className="text-sm font-medium">{badge.name}</div>
                  <div className="text-xs text-gray-400">{new Date(badge.earned_at).toLocaleDateString('es-CO')}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">Aún no tienes insignias</p>
          )}
        </div>

        {/* Todas las insignias */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">📋 Todas las Insignias</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {data?.allBadges?.map((badge, i) => {
              const earned = data.badges?.some(b => b.name === badge.name);
              return (
                <div key={i} className={`flex items-center gap-3 p-2 rounded ${earned ? 'bg-yellow-50' : 'bg-gray-50 opacity-50'}`}>
                  <span className="text-2xl">{badge.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{badge.name}</div>
                    <div className="text-xs text-gray-400">{badge.description}</div>
                  </div>
                  <span className="text-xs text-gray-400">{badge.points_required} pts</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Leaderboard */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">📊 Leaderboard</h2>
          <div className="space-y-2">
            {data?.leaderboard?.map((user, i) => (
              <div key={i} className={`flex items-center gap-3 p-2 rounded ${i < 3 ? 'bg-yellow-50' : 'bg-gray-50'}`}>
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-yellow-400 text-white' : i === 1 ? 'bg-gray-300 text-gray-700' : i === 2 ? 'bg-orange-300 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                  {i + 1}
                </span>
                <span className="flex-1 font-medium">{user.name}</span>
                <span className="text-sm text-gray-500">Nv.{user.level}</span>
                <span className="text-sm font-bold">{user.total_points} pts</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actividad reciente */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">📜 Actividad Reciente</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {data?.recentHistory?.map((h, i) => (
              <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                <span>{h.reason}</span>
                <span className="text-green-600 font-medium">+{h.points}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamificationDashboard;