import React, { useState } from 'react';
import api from '../services/api';

const BarcodeScanner = () => {
  const [scanCode, setScanCode] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleScan = async () => {
    if (!scanCode.trim()) return;
    
    setLoading(true);
    try {
      const response = await api.post('/barcode/scan', { code: scanCode });
      setResult(response.data);
    } catch (error) {
      console.error('Error scanning:', error);
      setResult({ found: false, message: 'Error al escanear' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Escáner de Código de Barras</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Escanear Código</h2>
        
        <div className="flex gap-3">
          <input
            type="text"
            value={scanCode}
            onChange={(e) => setScanCode(e.target.value)}
            placeholder="Escanear o ingresar código..."
            className="flex-1 border rounded px-4 py-2"
            onKeyPress={(e) => e.key === 'Enter' && handleScan()}
          />
          <button
            onClick={handleScan}
            disabled={loading || !scanCode.trim()}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Escaneando...' : 'Escanear'}
          </button>
        </div>
      </div>

      {result && (
        <div className={`rounded-lg shadow p-6 ${result.found ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          {result.found ? (
            <div>
              <h3 className="text-lg font-semibold text-green-800 mb-2">✓ Activo Encontrado</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nombre</p>
                  <p className="font-medium">{result.asset.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tipo</p>
                  <p className="font-medium">{result.asset.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <p className="font-medium">{result.asset.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ubicación</p>
                  <p className="font-medium">{result.asset.location}</p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">✗ No Encontrado</h3>
              <p className="text-red-600">{result.message}</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold mb-2">Información</h3>
        <p className="text-sm text-gray-600">
          Puede escanear códigos de barras o códigos QR de activos. 
          También puede ingresar el código manualmente en el campo de texto.
        </p>
      </div>
    </div>
  );
};

export default BarcodeScanner;
