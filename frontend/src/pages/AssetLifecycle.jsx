import React, { useState, useEffect } from 'react';
import api from '../services/api';

const AssetLifecycle = () => {
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [lifecycle, setLifecycle] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await api.get('/assets');
      setAssets(response.data);
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  };

  const fetchLifecycle = async (assetId) => {
    setLoading(true);
    try {
      const response = await api.get(`/asset-lifecycle/${assetId}/lifecycle`);
      setLifecycle(response.data);
      setSelectedAsset(assets.find(a => a.id === assetId));
    } catch (error) {
      console.error('Error fetching lifecycle:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMaintenance = async () => {
    try {
      const response = await api.get('/asset-lifecycle/maintenance/scheduled');
      setMaintenance(response.data);
    } catch (error) {
      console.error('Error fetching maintenance:', error);
    }
  };

  useEffect(() => {
    fetchMaintenance();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Ciclo de Vida de Activos</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-3">Seleccionar Activo</h2>
          <select 
            onChange={(e) => e.target.value && fetchLifecycle(e.target.value)}
            className="w-full border rounded px-4 py-2"
          >
            <option value="">Seleccionar activo...</option>
            {assets.map(asset => (
              <option key={asset.id} value={asset.id}>
                {asset.name} ({asset.serial_number})
              </option>
            ))}
          </select>

          {selectedAsset && (
            <div className="mt-4 bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-2">{selectedAsset.name}</h3>
              <p className="text-sm text-gray-600">Tipo: {selectedAsset.type}</p>
              <p className="text-sm text-gray-600">Estado: {selectedAsset.status}</p>
              <p className="text-sm text-gray-600">Ubicación: {selectedAsset.location}</p>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">Historial del Ciclo de Vida</h2>
          {loading ? (
            <div className="text-center py-4">Cargando...</div>
          ) : lifecycle.length > 0 ? (
            <div className="space-y-3">
              {lifecycle.map((event, index) => (
                <div key={index} className="bg-white rounded-lg shadow p-3">
                  <div className="flex justify-between">
                    <span className="font-medium">{event.event_type}</span>
                    <span className="text-sm text-gray-500">{event.event_date}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-4">
              Selecciona un activo para ver su historial
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-3">Mantenimiento Programado</h2>
        <div className="bg-white rounded-lg shadow">
          {maintenance.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Activo</th>
                  <th className="px-4 py-2 text-left">Tipo</th>
                  <th className="px-4 py-2 text-left">Fecha</th>
                  <th className="px-4 py-2 text-left">Descripción</th>
                </tr>
              </thead>
              <tbody>
                {maintenance.map((item, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-4 py-2">{item.asset_name}</td>
                    <td className="px-4 py-2">{item.type}</td>
                    <td className="px-4 py-2">{item.scheduled_date}</td>
                    <td className="px-4 py-2">{item.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-gray-500 text-center py-4">
              No hay mantenimiento programado
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssetLifecycle;
