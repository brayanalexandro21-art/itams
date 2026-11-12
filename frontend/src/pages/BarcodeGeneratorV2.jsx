import React, { useState, useEffect } from 'react';
import api from '../services/api';

const BarcodeGeneratorV2 = () => {
  const [assetId, setAssetId] = useState('');
  const [barcodeData, setBarcodeData] = useState(null);
  const [scanCode, setScanCode] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      const response = await api.get('/barcode-generator-v2/scan-history');
      setHistory(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const generateBarcode = async () => {
    if (!assetId.trim()) return;
    setLoading(true);
    try {
      const response = await api.get(`/barcode-generator-v2/asset/${assetId}`);
      setBarcodeData(response.data);
    } catch (error) {
      console.error('Error:', error);
      setBarcodeData(null);
    } finally {
      setLoading(false);
    }
  };

  const scanCode_handler = async () => {
    if (!scanCode.trim()) return;
    setLoading(true);
    try {
      const response = await api.post('/barcode-generator-v2/scan', { code: scanCode });
      setScanResult(response.data);
      fetchHistory();
    } catch (error) {
      console.error('Error:', error);
      setScanResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">📱 Generador de Código de Barras V2</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Generar código */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Generar Código de Barras</h2>
          <div className="flex gap-2 mb-4">
            <input type="text" value={assetId} onChange={(e) => setAssetId(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && generateBarcode()} placeholder="ID del activo" className="border rounded px-4 py-2 flex-1" />
            <button onClick={generateBarcode} disabled={loading} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50">
              Generar
            </button>
          </div>

          {barcodeData && (
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="mb-4">
                <div className="bg-white p-4 inline-block border-2 border-black rounded" style={{ fontFamily: 'monospace' }}>
                  <div className="text-3xl font-bold tracking-widest">|{barcodeData.barcode.replace(/./g, '$&|')}</div>
                </div>
              </div>
              <div className="text-sm space-y-1">
                <div><span className="text-gray-500">Código:</span> <span className="font-mono font-bold">{barcodeData.barcode}</span></div>
                <div><span className="text-gray-500">Formato:</span> {barcodeData.format}</div>
                <div><span className="text-gray-500">Activo:</span> {barcodeData.name}</div>
                <div><span className="text-gray-500">Serial:</span> {barcodeData.serial_number || 'N/A'}</div>
              </div>
              <button onClick={() => window.print()} className="mt-4 bg-green-500 text-white px-4 py-2 rounded text-sm">Imprimir</button>
            </div>
          )}
        </div>

        {/* Escanear código */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Escanear Código</h2>
          <div className="flex gap-2 mb-4">
            <input type="text" value={scanCode} onChange={(e) => setScanCode(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && scanCode_handler()} placeholder="Código de barras o QR" className="border rounded px-4 py-2 flex-1" />
            <button onClick={scanCode_handler} disabled={loading} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50">
              Escanear
            </button>
          </div>

          {scanResult && (
            <div className={`p-4 rounded-lg ${scanResult.found ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              {scanResult.found ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-600 text-xl">✓</span>
                    <span className="font-medium text-green-800">Activo encontrado ({scanResult.type})</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div>{scanResult.asset.name}</div>
                    <div>Tipo: {scanResult.asset.type}</div>
                    <div>Serial: {scanResult.asset.serial_number || 'N/A'}</div>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <span className="text-red-600 text-xl">✗</span>
                  <div className="text-red-800 font-medium">Código no reconocido</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">📜 Historial de Escaneos</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Escaneado por</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {history.slice(0, 20).map((h, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{new Date(h.scanned_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm">{h.asset_name || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm">{h.scanned_by_name || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BarcodeGeneratorV2;