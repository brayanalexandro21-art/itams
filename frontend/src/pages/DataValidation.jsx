import React, { useState } from 'react';
import api from '../services/api';

const DataValidation = () => {
  const [entity, setEntity] = useState('ticket');
  const [data, setData] = useState({});
  const [result, setResult] = useState(null);

  const validate = async () => {
    try {
      const response = await api.post('/data-validation/validate', { entity, data });
      setResult(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">✅ Validación de Datos</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Entidad</label>
          <select
            value={entity}
            onChange={(e) => setEntity(e.target.value)}
            className="border rounded px-4 py-2"
          >
            <option value="ticket">Ticket</option>
            <option value="asset">Activo</option>
            <option value="user">Usuario</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Datos (JSON)</label>
          <textarea
            value={JSON.stringify(data, null, 2)}
            onChange={(e) => {
              try { setData(JSON.parse(e.target.value)); } catch {}
            }}
            className="w-full border rounded px-4 py-2 font-mono text-sm"
            rows={8}
            placeholder='{"title": "Mi ticket", "description": "Descripción..."}'
          />
        </div>

        <button
          onClick={validate}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
        >
          Validar
        </button>

        {result && (
          <div className={`mt-4 p-4 rounded-lg ${result.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            {result.valid ? (
              <p className="text-green-800 font-medium">✓ Datos válidos</p>
            ) : (
              <div>
                <p className="text-red-800 font-medium mb-2">✗ Errores encontrados:</p>
                <ul className="list-disc list-inside text-red-700">
                  {result.errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataValidation;