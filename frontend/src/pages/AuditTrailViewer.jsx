import React, { useState, useEffect } from 'react';
import api from '../services/api';

const AuditTrailViewer = () => {
  const [data, setData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({ action: '', user_id: '', entity_type: '', date_from: '', date_to: '' });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [filters, page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
      params.append('page', page);

      const [logsRes, sumRes] = await Promise.all([
        api.get(`/audit-trail?${params}`),
        api.get('/audit-trail/summary')
      ]);
      setData(logsRes.data);
      setSummary(sumRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    if (action?.includes('delete')) return 'bg-red-100 text-red-800';
    if (action?.includes('create')) return 'bg-green-100 text-green-800';
    if (action?.includes('update')) return 'bg-blue-100 text-blue-800';
    if (action?.includes('login')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">📋 Visor de Auditoría</h1>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <h3 className="text-sm text-gray-500">Total Registros</h3>
          <p className="text-2xl font-bold">{summary?.total?.toLocaleString() || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <h3 className="text-sm text-gray-500">Hoy</h3>
          <p className="text-2xl font-bold text-blue-600">{summary?.today || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <h3 className="text-sm text-gray-500">Top Acción</h3>
          <p className="text-lg font-bold capitalize">{summary?.byAction?.[0]?.action || 'N/A'}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <h3 className="text-sm text-gray-500">Top Usuario</h3>
          <p className="text-lg font-bold">{summary?.byUser?.[0]?.name || 'N/A'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-3">Por Acción</h2>
          <div className="space-y-2">
            {summary?.byAction?.map((a, i) => (
              <div key={i} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                <span className="capitalize">{a.action}</span>
                <span className="font-bold">{a.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-3">Por Usuario</h2>
          <div className="space-y-2">
            {summary?.byUser?.map((u, i) => (
              <div key={i} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                <span>{u.name}</span>
                <span className="font-bold">{u.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-3">Críticas Recientes</h2>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {summary?.recentCritical?.map((c, i) => (
              <div key={i} className="p-2 bg-red-50 rounded text-sm">
                <span className="font-medium">{c.user_name}</span>
                <span className="text-gray-500 ml-1">{c.action}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <input type="text" value={filters.action} onChange={(e) => setFilters({...filters, action: e.target.value})} placeholder="Acción" className="border rounded px-3 py-2 text-sm w-40" />
          <input type="text" value={filters.entity_type} onChange={(e) => setFilters({...filters, entity_type: e.target.value})} placeholder="Entidad" className="border rounded px-3 py-2 text-sm w-40" />
          <input type="date" value={filters.date_from} onChange={(e) => setFilters({...filters, date_from: e.target.value})} className="border rounded px-3 py-2 text-sm" />
          <input type="date" value={filters.date_to} onChange={(e) => setFilters({...filters, date_to: e.target.value})} className="border rounded px-3 py-2 text-sm" />
          <button onClick={() => { setFilters({ action: '', user_id: '', entity_type: '', date_from: '', date_to: '' }); setPage(1); }} className="text-gray-500 text-sm hover:text-red-500">Limpiar</button>
        </div>
      </div>

      {/* Logs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entidad</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detalles</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data?.logs?.map((log, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-xs whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                <td className="px-4 py-3 text-sm">{log.user_name || 'N/A'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${getActionColor(log.action)}`}>{log.action}</span>
                </td>
                <td className="px-4 py-3 text-sm">{log.entity_type || '-'}</td>
                <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">{log.details || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.total > data?.limit && (
          <div className="p-4 flex justify-center gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Anterior</button>
            <span className="px-3 py-1 text-sm text-gray-500">Página {page} de {Math.ceil(data.total / data.limit)}</span>
            <button onClick={() => setPage(page + 1)} disabled={page * data.limit >= data.total} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Siguiente</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditTrailViewer;