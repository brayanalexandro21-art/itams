import React, { useState, useEffect } from 'react';
import api from '../services/api';

const SatisfactionReport = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get('/advanced-reporting/satisfaction');
      setData(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">⭐ Reporte de Satisfacción</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Calificación Promedio</h2>
        <div className="text-center">
          <div className="text-6xl font-bold text-yellow-500">
            {data?.average?.toFixed(1) || 'N/A'}
          </div>
          <div className="text-gray-500">de 5.0</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Distribución de Calificaciones</h2>
        <div className="space-y-3">
          {data?.ratings?.map((rating, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-12 text-center font-medium">{rating.rating}⭐</div>
              <div className="flex-1 bg-gray-200 rounded-full h-6">
                <div
                  className="bg-yellow-500 h-6 rounded-full flex items-center justify-end pr-2"
                  style={{ width: `${rating.percentage}%` }}
                >
                  <span className="text-xs text-white font-medium">{rating.count}</span>
                </div>
              </div>
              <div className="w-16 text-right text-sm text-gray-500">
                {rating.percentage}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SatisfactionReport;