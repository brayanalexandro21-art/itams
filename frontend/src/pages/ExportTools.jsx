import React, { useState } from 'react';
import api from '../services/api';

const ExportTools = () => {
  const [selectedEntity, setSelectedEntity] = useState('tickets');
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await api.get(`/export/csv/${selectedEntity}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedEntity}_export.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Error al exportar');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Herramientas de Exportación</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Exportar Datos</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleccionar entidad
          </label>
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="w-full border rounded px-4 py-2"
          >
            <option value="tickets">Tickets</option>
            <option value="assets">Activos</option>
            <option value="users">Usuarios</option>
            <option value="knowledge_base">Base de Conocimiento</option>
          </select>
        </div>

        <button
          onClick={handleExport}
          disabled={exporting}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {exporting ? 'Exportando...' : 'Exportar CSV'}
        </button>
      </div>

      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold mb-2">Formatos Disponibles</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• CSV - Compatible con Excel y otras hojas de cálculo</li>
          <li>• PDF - Documentos impresos (próximamente)</li>
          <li>• Excel - Archivos .xlsx nativos (próximamente)</li>
        </ul>
      </div>
    </div>
  );
};

export default ExportTools;
