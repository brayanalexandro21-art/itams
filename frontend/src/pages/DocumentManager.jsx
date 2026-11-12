import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Icono, IconoTitulo } from '../components/Icono';

const DocumentManager = () => {
  const [documents, setDocuments] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, [filter]);

  const fetchDocuments = async () => {
    try {
      const url = filter ? `/document-management/list?category=${filter}` : '/document-management/list';
      const response = await api.get(url);
      setDocuments(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'manual': return '📘';
      case 'policy': return '📋';
      case 'template': return '📝';
      default: return '📄';
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-3"><IconoTitulo e="📁" />Gestión de Documentos</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Documentos</h2>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">Todas las categorías</option>
            <option value="manual">Manuales</option>
            <option value="policy">Políticas</option>
            <option value="template">Plantillas</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-8">Cargando...</div>
        ) : documents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map(doc => (
              <div key={doc.id} className="border rounded-lg p-4 hover:shadow-md">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl"><Icono e={getCategoryIcon(doc.category)} className="h-7 w-7" /></span>
                  <span className="font-medium">{doc.name}</span>
                </div>
                <p className="text-sm text-gray-500 mb-2">{doc.description}</p>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{doc.category}</span>
                  <span>{new Date(doc.created_at).toLocaleDateString('es-CO')}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">No hay documentos</div>
        )}
      </div>
    </div>
  );
};

export default DocumentManager;