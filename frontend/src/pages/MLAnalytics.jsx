import React, { useState, useEffect } from 'react';
import api from '../services/api';

const MLAnalytics = () => {
  const [predictions, setPredictions] = useState(null);
  const [anomalies, setAnomalies] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [predRes, anomRes, recRes] = await Promise.all([
        api.get('/ml-analytics/ticket-predictions'),
        api.get('/ml-analytics/anomaly-detection'),
        api.get('/ml-analytics/recommendations'),
      ]);
      setPredictions(predRes.data);
      setAnomalies(anomRes.data);
      setRecommendations(recRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Cargando análisis ML...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">🤖 Analíticas ML / IA</h1>

      {/* Predicciones */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Predicciones de Tickets (7 días)</h2>
        <div className="grid grid-cols-7 gap-2">
          {predictions?.predictions?.map((pred, i) => (
            <div key={i} className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-500">{pred.date}</div>
              <div className="text-xl font-bold text-blue-600">{pred.predicted}</div>
              <div className="text-xs text-gray-400">{pred.confidence}% confianza</div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-gray-500">
          Promedio diario: {predictions?.avg_daily} tickets
        </p>
      </div>

      {/* Anomalías */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">⚠️ Detección de Anomalías</h2>
        {anomalies?.anomalies?.length > 0 ? (
          <div className="space-y-2">
            {anomalies.anomalies.map((anomaly, i) => (
              <div key={i} className={`p-3 rounded-lg ${
                anomaly.severity === 'high' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <span className="font-medium">{anomaly.description}</span>
                <span className="ml-2 text-sm text-gray-500">{anomaly.date}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No se detectaron anomalías</p>
        )}
      </div>

      {/* Recomendaciones */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">💡 Recomendaciones</h2>
        {recommendations.length > 0 ? (
          <div className="space-y-2">
            {recommendations.map((rec, i) => (
              <div key={i} className={`p-3 rounded-lg ${
                rec.priority === 'critical' ? 'bg-red-50 border border-red-200' :
                rec.priority === 'high' ? 'bg-orange-50 border border-orange-200' :
                'bg-blue-50 border border-blue-200'
              }`}>
                <span className="font-medium">{rec.message}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No hay recomendaciones en este momento</p>
        )}
      </div>
    </div>
  );
};

export default MLAnalytics;