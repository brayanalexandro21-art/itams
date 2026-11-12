import React, { useState } from 'react';
import api from '../services/api';

const SearchAdvanced = () => {
  const [query, setQuery] = useState('');
  const [entityType, setEntityType] = useState('');
  const [results, setResults] = useState(null);
  const [savedSearches, setSavedSearches] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const response = await api.get(`/search-advanced/global?q=${query}&type=${entityType}`);
      setResults(response.data);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSearch = async () => {
    const name = prompt('Nombre para esta búsqueda:');
    if (!name) return;
    try {
      await api.post('/search-advanced/saved', { name, query, filters: { entityType } });
      alert('Búsqueda guardada');
    } catch (error) {
      console.error('Error saving search:', error);
    }
  };

  const loadSavedSearches = async () => {
    try {
      const response = await api.get('/search-advanced/saved');
      setSavedSearches(response.data);
    } catch (error) {
      console.error('Error loading searches:', error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Búsqueda Avanzada</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex gap-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar..."
            className="flex-1 border rounded px-4 py-2"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="border rounded px-4 py-2"
          >
            <option value="">Todos</option>
            <option value="tickets">Tickets</option>
            <option value="assets">Activos</option>
            <option value="knowledge_base">Base de Conocimiento</option>
          </select>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
          <button
            onClick={saveSearch}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Guardar
          </button>
        </div>
      </div>

      {results && (
        <div className="space-y-4">
          <p className="text-gray-600">Se encontraron {results.total} resultados</p>
          
          {results.tickets?.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-2">Tickets ({results.tickets.length})</h3>
              {results.tickets.map(ticket => (
                <div key={ticket.id} className="p-2 border-b last:border-b-0">
                  <span className="font-medium">#{ticket.id}</span> {ticket.title}
                  <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                    ticket.status === 'open' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                  }`}>{ticket.status}</span>
                </div>
              ))}
            </div>
          )}

          {results.assets?.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-2">Activos ({results.assets.length})</h3>
              {results.assets.map(asset => (
                <div key={asset.id} className="p-2 border-b last:border-b-0">
                  <span className="font-medium">{asset.name}</span>
                  <span className="ml-2 text-gray-500">({asset.serial_number})</span>
                </div>
              ))}
            </div>
          )}

          {results.knowledge_base?.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-2">Base de Conocimiento ({results.knowledge_base.length})</h3>
              {results.knowledge_base.map(article => (
                <div key={article.id} className="p-2 border-b last:border-b-0">
                  <span className="font-medium">{article.title}</span>
                  <span className="ml-2 text-gray-500">({article.category})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchAdvanced;