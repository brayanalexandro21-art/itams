import React, { useState, useEffect } from 'react';
import api from '../services/api';

const ActivityHeatmap = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/activity-heatmap/dashboard').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6">Cargando...</div>;

  const getHeatColor = (count) => {
    if (count === 0) return 'bg-gray-100';
    if (count < 3) return 'bg-green-100';
    if (count < 6) return 'bg-green-200';
    if (count < 10) return 'bg-green-400';
    return 'bg-green-600';
  };

  // Build 30-day grid
  const today = new Date();
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayData = data?.userActions?.find(a => a.date === dateStr);
    days.push({ date: dateStr, count: dayData?.count || 0, day: d.toLocaleDateString('es', { weekday: 'short' }) });
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">🔥 Mapa de Actividad</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <h3 className="text-sm text-gray-500">Acciones (30 días)</h3>
          <p className="text-2xl font-bold">{data?.totalActions || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <h3 className="text-sm text-gray-500">Racha Actual</h3>
          <p className="text-2xl font-bold text-orange-500">{data?.streak || 0} días</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <h3 className="text-sm text-gray-500">Días Activos</h3>
          <p className="text-2xl font-bold text-green-600">{data?.userActions?.filter(a => a.count > 0).length || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <h3 className="text-sm text-gray-500">Promedio Diario</h3>
          <p className="text-2xl font-bold">{data?.userActions?.length ? Math.round(data.totalActions / data.userActions.length) : 0}</p>
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Actividad Últimos 30 Días</h2>
        <div className="flex flex-wrap gap-1">
          {days.map((d, i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded flex items-center justify-center text-xs ${getHeatColor(d.count)} cursor-default`}
              title={`${d.date}: ${d.count} acciones`}
            >
              {d.count > 0 ? d.count : ''}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
          <span>Menos</span>
          <div className="w-4 h-4 bg-gray-100 rounded"></div>
          <div className="w-4 h-4 bg-green-100 rounded"></div>
          <div className="w-4 h-4 bg-green-200 rounded"></div>
          <div className="w-4 h-4 bg-green-400 rounded"></div>
          <div className="w-4 h-4 bg-green-600 rounded"></div>
          <span>Más</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Activity by hour */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Por Hora (7 días)</h2>
          <div className="flex items-end gap-1 h-32">
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

        {/* Top actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Acciones Más Frecuentes</h2>
          <div className="space-y-2">
            {data?.byAction?.map((a, i) => (
              <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                <span className="capitalize">{a.action}</span>
                <span className="font-bold">{a.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityHeatmap;