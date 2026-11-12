import { useState, useEffect } from 'react';
import api from '../services/api';
import { categoria, tipoActivo } from '../components/ui';

function Reports() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateRange.start) params.append('start_date', dateRange.start);
      if (dateRange.end) params.append('end_date', dateRange.end);

      const response = await api.get(`/reports/dashboard?${params.toString()}`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type) => {
    try {
      const response = await api.get(`/reports/export/${type}?format=csv`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando reportes…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Reportes y analítica</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => handleExport('tickets')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Exportar tickets (CSV)
          </button>
          <button
            onClick={() => handleExport('assets')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Exportar activos (CSV)
          </button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicial</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha final</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={() => setDateRange({ start: '', end: '' })}
            className="mt-5 px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Limpiar
          </button>
        </div>
      </div>

      {stats && (
        <>
          {/* Ticket Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="text-sm font-medium text-gray-500">Tickets totales</h4>
              <p className="text-3xl font-bold text-gray-800">{stats.tickets.total}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="text-sm font-medium text-gray-500">Tiempo promedio de resolución</h4>
              <p className="text-3xl font-bold text-gray-800">
                {Math.round(stats.avgResolutionTime)}h
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="text-sm font-medium text-gray-500">Activos totales</h4>
              <p className="text-3xl font-bold text-gray-800">{stats.assets.total}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="text-sm font-medium text-gray-500">Artículos de conocimiento</h4>
              <p className="text-3xl font-bold text-gray-800">{stats.knowledgeBase.total_articles}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ticket Status Distribution */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Estado de los tickets</h3>
              <div className="space-y-3">
                {[
                  { label: 'Abiertos', value: stats.tickets.open, color: 'bg-yellow-500' },
                  { label: 'En progreso', value: stats.tickets.in_progress, color: 'bg-blue-500' },
                  { label: 'Resueltos', value: stats.tickets.resolved, color: 'bg-green-500' },
                  { label: 'Cerrados', value: stats.tickets.closed, color: 'bg-gray-500' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center">
                    <div className="w-32 text-sm text-gray-600">{item.label}</div>
                    <div className="flex-1 mx-4">
                      <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color}`}
                          style={{
                            width: `${stats.tickets.total ? (item.value / stats.tickets.total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="w-12 text-right font-medium">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority Distribution */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribución por prioridad</h3>
              <div className="space-y-3">
                {[
                  { label: 'Urgente', value: stats.tickets.urgent, color: 'bg-red-500' },
                  { label: 'Alta', value: stats.tickets.high, color: 'bg-orange-500' },
                  { label: 'Media', value: stats.tickets.medium, color: 'bg-yellow-500' },
                  { label: 'Baja', value: stats.tickets.low, color: 'bg-green-500' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center">
                    <div className="w-32 text-sm text-gray-600">{item.label}</div>
                    <div className="flex-1 mx-4">
                      <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color}`}
                          style={{
                            width: `${stats.tickets.total ? (item.value / stats.tickets.total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="w-12 text-right font-medium">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tickets by Category */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Tickets por categoría</h3>
              <div className="space-y-2">
                {stats.ticketsByCategory.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Sin datos</p>
                ) : (
                  stats.ticketsByCategory.map((item) => (
                    <div key={item.category} className="flex items-center justify-between py-2 border-b">
                      <span className="text-gray-700">{categoria(item.category)}</span>
                      <span className="font-medium text-gray-800">{item.count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Technicians */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Técnicos destacados</h3>
              <div className="space-y-2">
                {stats.topTechnicians.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Sin datos</p>
                ) : (
                  stats.topTechnicians.map((tech, index) => (
                    <div key={tech.name} className="flex items-center justify-between py-2 border-b">
                      <div className="flex items-center">
                        <span className="w-6 h-6 bg-indigo-100 text-indigo-800 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                          {index + 1}
                        </span>
                        <span className="text-gray-700">{tech.name}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {tech.resolved_count}/{tech.ticket_count} resueltos
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Asset Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Estado de los activos</h3>
              <div className="space-y-3">
                {[
                  { label: 'Disponibles', value: stats.assets.available, color: 'bg-green-500' },
                  { label: 'En uso', value: stats.assets.in_use, color: 'bg-blue-500' },
                  { label: 'Mantenimiento', value: stats.assets.maintenance, color: 'bg-yellow-500' },
                  { label: 'Retirados', value: stats.assets.retired, color: 'bg-gray-500' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center">
                    <div className="w-32 text-sm text-gray-600">{item.label}</div>
                    <div className="flex-1 mx-4">
                      <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color}`}
                          style={{
                            width: `${stats.assets.total ? (item.value / stats.assets.total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="w-12 text-right font-medium">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Assets by Type */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Activos por tipo</h3>
              <div className="space-y-2">
                {stats.assetsByType.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Sin datos</p>
                ) : (
                  stats.assetsByType.map((item) => (
                    <div key={item.type} className="flex items-center justify-between py-2 border-b">
                      <span className="text-gray-700 capitalize">{tipoActivo(item.type)}</span>
                      <span className="font-medium text-gray-800">{item.count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Tickets by Day Chart (Simple) */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Tickets por día (últimos 30 días)</h3>
            <div className="h-64 flex items-end space-x-1">
              {stats.ticketsByDay.length === 0 ? (
                <div className="w-full text-center text-gray-500">Sin datos</div>
              ) : (
                stats.ticketsByDay.map((day) => {
                  const maxCount = Math.max(...stats.ticketsByDay.map(d => d.count));
                  const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-indigo-500 rounded-t"
                        style={{ height: `${height}%` }}
                        title={`${day.date}: ${day.count} tickets`}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(day.date).getDate()}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Reports;
