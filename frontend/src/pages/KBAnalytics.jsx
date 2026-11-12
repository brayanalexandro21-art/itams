import React, { useState, useEffect } from 'react';
import api from '../services/api';

const KBAnalytics = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      const response = await api.get('/kb-analytics/overview');
      setOverview(response.data);
    } catch (error) {
      console.error('Error fetching overview:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Analíticas de Knowledge Base</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Artículos</h3>
          <p className="text-2xl font-bold">{overview?.total_articles || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Vistas</h3>
          <p className="text-2xl font-bold">{overview?.total_views || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Calificación Promedio</h3>
          <p className="text-2xl font-bold">{overview?.avg_rating?.toFixed(1) || 'N/A'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Por Categoría</h2>
          {overview?.categories?.map((cat, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b">
              <span>{cat.category}</span>
              <span className="font-medium">{cat.count}</span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Más Populares</h2>
          {overview?.popular_articles?.map((article, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b">
              <span className="truncate">{article.title}</span>
              <span className="font-medium">{article.views} vistas</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KBAnalytics;