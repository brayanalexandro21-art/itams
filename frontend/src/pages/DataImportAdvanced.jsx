import React, { useState } from 'react';
import api from '../services/api';
import { IconoTitulo } from '../components/Icono';

const DataImportAdvanced = () => {
  const [entity, setEntity] = useState('tickets');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mappings, setMappings] = useState({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      // Simular lectura del CSV
      const reader = new FileReader();
      reader.onload = (event) => {
        const lines = event.target.result.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const rows = lines.slice(1, 6).map(line => {
          const values = line.split(',').map(v => v.trim());
          return headers.reduce((obj, header, i) => {
            obj[header] = values[i];
            return obj;
          }, {});
        });
        setPreview({ headers, rows });
      };
      reader.readAsText(uploadedFile);
    }
  };

  const handleImport = async () => {
    if (!preview) return;
    setImporting(true);
    try {
      const response = await api.post('/data-import/import', {
        entity,
        data: preview.rows,
        mappings: {
          title: preview.headers[0],
          name: preview.headers[0],
          email: preview.headers[1],
        }
      });
      setResult(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-3"><IconoTitulo e="📤" />Importación de Datos CSV</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de datos</label>
          <select value={entity} onChange={(e) => setEntity(e.target.value)} className="border rounded px-4 py-2">
            <option value="tickets">Tickets</option>
            <option value="assets">Activos</option>
            <option value="users">Usuarios</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Archivo CSV</label>
          <input type="file" accept=".csv" onChange={handleFileUpload} className="border rounded px-4 py-2" />
        </div>

        {preview && (
          <div className="mb-4">
            <h3 className="font-medium mb-2">Vista previa (5 filas)</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border">
                <thead>
                  <tr className="bg-gray-50">
                    {preview.headers.map((h, i) => (
                      <th key={i} className="px-4 py-2 border text-left text-sm">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row, i) => (
                    <tr key={i} className="border-t">
                      {preview.headers.map((h, j) => (
                        <td key={j} className="px-4 py-2 border text-sm">{row[h]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <button
          onClick={handleImport}
          disabled={!preview || importing}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {importing ? 'Importando...' : 'Importar Datos'}
        </button>
      </div>

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-medium text-green-800">Importación completada</h3>
          <p className="text-green-700">Importados: {result.imported} | Errores: {result.errors}</p>
        </div>
      )}
    </div>
  );
};

export default DataImportAdvanced;