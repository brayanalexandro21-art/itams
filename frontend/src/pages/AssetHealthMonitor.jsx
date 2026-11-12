import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { tipoActivo } from '../components/ui';
import { Icono, IconoTitulo } from '../components/Icono';

const AssetHealthMonitor = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get('/asset-health/dashboard');
      setData(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBg = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-3"><IconoTitulo e="🏥" />Monitor de Salud de Activos</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Health Score */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Score General de Salud</h2>
          <div className="flex items-center justify-center">
            <div className="relative w-40 h-40">
              <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" stroke="#e5e7eb" strokeWidth="10" fill="none" />
                <circle cx="60" cy="60" r="50" stroke={data?.health_score >= 80 ? '#22c55e' : data?.health_score >= 60 ? '#eab308' : '#ef4444'} strokeWidth="10" fill="none" strokeDasharray={`${(data?.health_score || 0) * 3.14} 314`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-3xl font-bold ${getHealthColor(data?.health_score)}`}>{data?.health_score || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Resumen</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 rounded text-center">
              <p className="text-2xl font-bold">{data?.summary?.total || 0}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
            <div className="p-3 bg-green-50 rounded text-center">
              <p className="text-2xl font-bold text-green-600">{data?.summary?.healthy || 0}</p>
              <p className="text-xs text-gray-500">Disponibles</p>
            </div>
            <div className="p-3 bg-blue-50 rounded text-center">
              <p className="text-2xl font-bold text-blue-600">{data?.summary?.in_use || 0}</p>
              <p className="text-xs text-gray-500">En uso</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded text-center">
              <p className="text-2xl font-bold text-yellow-600">{data?.summary?.maintenance || 0}</p>
              <p className="text-xs text-gray-500">Mantenimiento</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* By Age */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Por Antigüedad</h2>
          <div className="space-y-3">
            {data?.byAge?.map((a, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{a.age_group === 'new' ? '< 1 año' : a.age_group === 'mid' ? '1-3 años' : '> 3 años'}</span>
                  <span>{a.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className={`h-3 rounded-full ${a.age_group === 'new' ? 'bg-green-500' : a.age_group === 'mid' ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${(a.count / (data?.summary?.total || 1)) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Type */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Por Tipo</h2>
          <div className="space-y-2">
            {data?.byType?.slice(0, 6).map((t, i) => (
              <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                <span>{tipoActivo(t.type)}</span>
                <span className="font-bold">{t.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Needs Maintenance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Icono e="⚠️" />Necesitan Mantenimiento</h2>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {data?.needsMaintenance?.length > 0 ? data.needsMaintenance.map((a, i) => (
              <div key={i} className="p-2 bg-yellow-50 rounded text-sm">
                <div className="font-medium">{a.name}</div>
                <div className="text-xs text-gray-500">{Math.round(a.days_since_maintenance)} días sin mantenimiento</div>
              </div>
            )) : (
              <p className="text-gray-400 text-center py-4 text-sm">Todos al día</p>
            )}
          </div>
        </div>
      </div>

      {/* Expiring Warranty */}
      {data?.expiringWarranty?.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Icono e="🛡️" />Garantías por Vencer (90 días)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {data.expiringWarranty.map((a, i) => (
              <div key={i} className="p-3 bg-orange-50 rounded">
                <div className="font-medium text-sm">{a.name}</div>
                <div className="text-xs text-gray-500">Vence: {a.warranty_expiry}</div>
                <div className="text-xs text-orange-600">{Math.round(a.days_left)} días restantes</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetHealthMonitor;