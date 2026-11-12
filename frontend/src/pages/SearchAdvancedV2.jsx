import React, { useState } from 'react';
import api from '../services/api';
import { IconoTitulo } from '../components/Icono';

const SearchAdvancedV2 = () => {
  const [query, setQuery] = useState('');
  const [entity, setEntity] = useState('tickets');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    date_from: '',
    date_to: '',
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    setLoading(true);
    try {
      const response = await api.post('/advanced-search/search-v2', {
        query,
        filters: { ...filters, entity },
        sort: { field: 'created_at', order: 'DESC' },
        page: 1,
        limit: 50
      });
      setResults(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-3"><IconoTitulo e="🔍" />Búsqueda Avanzada V2</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar..."
            className="border rounded px-4 py-2"
          />
          <select value={entity} onChange={(e) => setEntity(e.target.value)} className="border rounded px-4 py-2">
            <option value="tickets">Tickets</option>
            <option value="assets">Activos</option>
          </select>
          <button onClick={search} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})} className="border rounded px-3 py-2">
            <option value="">Estado</option>
            <option value="open">Abierto</option>
            <option value="in_progress">En Progreso</option>
            <option value="resolved">Resuelto</option>
          </select>
          <select value={filters.priority} onChange={(e) => setFilters({...filters, priority: e.target.value})} className="border rounded px-3 py-2">
            <option value="">Prioridad</option>
            <option value="critical">Crítica</option>
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baja</option>
          </select>
          <input type="date" value={filters.date_from} onChange={(e) => setFilters({...filters, date_from: e.target.value})} className="border rounded px-3 py-2" />
          <input type="date" value={filters.date_to} onChange={(e) => setFilters({...filters, date_to: e.target.value})} className="border rounded px-3 py-2" />
        </div>
      </div>

      {results && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Resultados ({results.pagination.total})</h2>
          <div className="space-y-3">
            {results.results.map((item, i) => (
              <div key={i} className="p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex justify-between">
                  <span className="font-medium">#{item.id} - {item.title || item.name}</span>
                  <span className={`px-2 py-1 rounded text-xs ${item.status === 'open' ? 'bg-yellow-100' : 'bg-green-100'}`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchAdvancedV2;