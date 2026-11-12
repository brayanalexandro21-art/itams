import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { IconoTitulo } from '../components/Icono';

const AuditExport = () => {
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({ date_from: '', date_to: '', action: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/audit-export/stats').then(r => setStats(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const exportCSV = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
    window.open(`/api/audit-export/export/csv?${params}`, '_blank');
  };

  const exportJSON = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
    window.open(`/api/audit-export/export/json?${params}`, '_blank');
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-3"><IconoTitulo e="📥" />Exportar Auditoría</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <h3 className="text-sm text-gray-500">Total Registros</h3>
          <p className="text-2xl font-bold">{stats?.total?.toLocaleString('es-CO') || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <h3 className="text-sm text-gray-500">Más antiguo</h3>
          <p className="text-sm font-medium">{stats?.oldest ? new Date(stats.oldest).toLocaleDateString('es-CO') : 'N/A'}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <h3 className="text-sm text-gray-500">Más reciente</h3>
          <p className="text-sm font-medium">{stats?.newest ? new Date(stats.newest).toLocaleDateString('es-CO') : 'N/A'}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <h3 className="text-sm text-gray-500">Tipos de Acción</h3>
          <p className="text-2xl font-bold">{stats?.actions?.length || 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Filtros de Exportación</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Fecha desde</label>
            <input type="date" value={filters.date_from} onChange={(e) => setFilters({...filters, date_from: e.target.value})} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Fecha hasta</label>
            <input type="date" value={filters.date_to} onChange={(e) => setFilters({...filters, date_to: e.target.value})} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Acción</label>
            <select value={filters.action} onChange={(e) => setFilters({...filters, action: e.target.value})} className="w-full border rounded px-3 py-2">
              <option value="">Todas</option>
              {stats?.actions?.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Exportar como CSV</h2>
          <p className="text-sm text-gray-500 mb-4">Formato tabular compatible con Excel y herramientas de análisis.</p>
          <button onClick={exportCSV} className="w-full bg-green-500 text-white py-3 rounded hover:bg-green-600 font-medium">
            Descargar CSV
          </button>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Exportar como JSON</h2>
          <p className="text-sm text-gray-500 mb-4">Formato estructurado para integración con otras herramientas.</p>
          <button onClick={exportJSON} className="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-600 font-medium">
            Descargar JSON
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditExport;