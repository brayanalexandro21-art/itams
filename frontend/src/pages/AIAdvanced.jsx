import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Icono, IconoTitulo } from '../components/Icono';

const AIAdvanced = () => {
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
        api.get('/ai-advanced/predictions'),
        api.get('/ai-advanced/anomalies'),
        api.get('/ai-advanced/recommendations'),
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

  if (loading) return <div className="p-6">Cargando análisis AI...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-3"><IconoTitulo e="🤖" />Analíticas AI Avanzadas</h1>

      {/* Predicciones */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Predicciones (7 días)</h2>
        <div className="grid grid-cols-7 gap-2">
          {predictions?.predictions?.map((pred, i) => (
            <div key={i} className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-500">{pred.date}</div>
              <div className="text-xl font-bold text-blue-600">{pred.predicted}</div>
              <div className="text-xs text-gray-400">{pred.confidence}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Anomalías */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Icono e="⚠️" />Anomalías Detectadas</h2>
        {anomalies?.anomalies?.length > 0 ? (
          anomalies.anomalies.map((a, i) => (
            <div key={i} className={`p-3 rounded-lg mb-2 ${a.severity === 'high' ? 'bg-red-50' : 'bg-yellow-50'}`}>
              <span className="font-medium">{a.description}</span>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No hay anomalías detectadas</p>
        )}
      </div>

      {/* Recomendaciones */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Icono e="💡" />Recomendaciones</h2>
        {recommendations.length > 0 ? (
          recommendations.map((rec, i) => (
            <div key={i} className={`p-3 rounded-lg mb-2 ${
              rec.priority === 'critical' ? 'bg-red-50' :
              rec.priority === 'high' ? 'bg-orange-50' : 'bg-blue-50'
            }`}>
              {rec.message}
            </div>
          ))
        ) : (
          <p className="text-gray-500">No hay recomendaciones</p>
        )}
      </div>
    </div>
  );
};

export default AIAdvanced;