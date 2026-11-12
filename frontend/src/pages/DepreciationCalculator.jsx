import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { IconoTitulo } from '../components/Icono';

const DepreciationCalculator = () => {
  const [summary, setSummary] = useState(null);
  const [assetId, setAssetId] = useState('');
  const [assetDepreciation, setAssetDepreciation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/depreciation-calculator/summary').then(r => setSummary(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const calculateForAsset = async () => {
    if (!assetId.trim()) return;
    try {
      const response = await api.get(`/depreciation-calculator/asset/${assetId}`);
      setAssetDepreciation(response.data);
    } catch (error) {
      console.error('Error:', error);
      setAssetDepreciation(null);
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-3"><IconoTitulo e="📉" />Calculadora de Depreciación</h1>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <h3 className="text-sm text-gray-500">Total Activos</h3>
          <p className="text-2xl font-bold">{summary?.total_assets || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <h3 className="text-sm text-gray-500">Costo Total</h3>
          <p className="text-2xl font-bold">${(summary?.total_cost || 0).toLocaleString('es-CO')}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <h3 className="text-sm text-gray-500">Valor en Libros</h3>
          <p className="text-2xl font-bold text-blue-600">${(summary?.total_book_value || 0).toLocaleString('es-CO')}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <h3 className="text-sm text-gray-500">Depreciación Acum.</h3>
          <p className="text-2xl font-bold text-red-600">${(summary?.total_depreciation || 0).toLocaleString('es-CO')}</p>
        </div>
      </div>

      {/* By type */}
      {summary?.by_type && Object.keys(summary.by_type).length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Por Tipo de Activo</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Costo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Libros</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Depreciación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.entries(summary.by_type).map(([type, data], i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm capitalize font-medium">{type}</td>
                    <td className="px-4 py-3 text-sm">{data.count}</td>
                    <td className="px-4 py-3 text-sm">${data.cost.toLocaleString('es-CO')}</td>
                    <td className="px-4 py-3 text-sm text-blue-600">${data.book_value.toLocaleString('es-CO')}</td>
                    <td className="px-4 py-3 text-sm text-red-600">${(data.cost - data.book_value).toLocaleString('es-CO')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Individual asset calculator */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Calcular Depreciación Individual</h2>
        <div className="flex gap-2 mb-4">
          <input type="text" value={assetId} onChange={(e) => setAssetId(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && calculateForAsset()} placeholder="ID del activo" className="border rounded px-4 py-2 flex-1" />
          <button onClick={calculateForAsset} className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">Calcular</button>
        </div>

        {assetDepreciation && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-3">Información del Activo</h3>
              <div className="space-y-2 text-sm">
                <div><span className="text-gray-500">Nombre:</span> {assetDepreciation.asset_name}</div>
                <div><span className="text-gray-500">Costo:</span> ${assetDepreciation.purchase_cost.toLocaleString('es-CO')}</div>
                <div><span className="text-gray-500">Fecha compra:</span> {assetDepreciation.purchase_date}</div>
                <div><span className="text-gray-500">Vida útil:</span> {assetDepreciation.useful_life_years} años</div>
                <div><span className="text-gray-500">Valor residual:</span> ${assetDepreciation.residual_value.toLocaleString('es-CO')}</div>
                <div><span className="text-gray-500">Edad:</span> {assetDepreciation.age_years} años</div>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-3">Cálculos de Depreciación</h3>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded">
                  <div className="text-sm font-medium text-blue-800">Línea Recta</div>
                  <div className="text-xs text-gray-600 mt-1">Anual: ${assetDepreciation.methods.straight_line.annual.toLocaleString('es-CO')}</div>
                  <div className="text-xs text-gray-600">Acumulada: ${assetDepreciation.methods.straight_line.accumulated.toLocaleString('es-CO')}</div>
                  <div className="text-xs text-blue-600 font-bold">Valor libros: ${assetDepreciation.methods.straight_line.book_value.toLocaleString('es-CO')}</div>
                </div>
                <div className="p-3 bg-purple-50 rounded">
                  <div className="text-sm font-medium text-purple-800">Saldo Decreciente</div>
                  <div className="text-xs text-purple-600 font-bold">Valor libros: ${assetDepreciation.methods.declining_balance.book_value.toLocaleString('es-CO')}</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-sm text-gray-500">Depreciación total</div>
                  <div className="text-2xl font-bold text-red-600">{assetDepreciation.depreciation_percent}%</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepreciationCalculator;