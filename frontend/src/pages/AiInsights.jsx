import { useState, useEffect } from 'react';
import api from '../services/api';
import { Icono } from '../components/Icono';

function AiInsights() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testData, setTestData] = useState({ title: '', description: '' });
  const [categorizeResult, setCategorizeResult] = useState(null);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const response = await api.get('/ai/insights');
      setInsights(response.data);
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorize = async () => {
    if (!testData.title) return;
    try {
      const response = await api.post('/ai/categorize', testData);
      setCategorizeResult(response.data);
    } catch (error) {
      console.error('Error categorizing:', error);
    }
  };

  const getInsightIcon = (type) => {
    const icons = {
      info: 'ℹ️',
      warning: '⚠️',
      trend: '📈',
      suggestion: '💡',
    };
    return icons[type] || '📊';
  };

  const getInsightColor = (type) => {
    const colors = {
      info: 'bg-blue-50 border-blue-200 text-blue-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      trend: 'bg-purple-50 border-purple-200 text-purple-800',
      suggestion: 'bg-green-50 border-green-200 text-green-800',
    };
    return colors[type] || 'bg-gray-50 border-gray-200 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando análisis inteligente…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Análisis con IA</h2>

      {/* AI Insights */}
      {insights && (
        <>
          {/* Insights Cards */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800">Hallazgos</h3>
            {insights.insights.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                Aún no hay hallazgos. Registra más tickets para obtener sugerencias.
              </div>
            ) : (
              insights.insights.map((insight, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}
                >
                  <div className="flex items-center">
                    <span className="text-xl mr-3"><Icono e={getInsightIcon(insight.type)} className="h-6 w-6" /></span>
                    <span className="font-medium">{insight.message}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Distribution */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Categorías de tickets</h3>
              {insights.categoryStats.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Sin datos</p>
              ) : (
                <div className="space-y-3">
                  {insights.categoryStats.map((stat) => {
                    const maxCount = Math.max(...insights.categoryStats.map(s => s.count));
                    const percentage = maxCount > 0 ? (stat.count / maxCount) * 100 : 0;
                    return (
                      <div key={stat.category}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700 capitalize">{stat.category}</span>
                          <span className="text-gray-500">{stat.count}</span>
                        </div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Priority Distribution */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribución por prioridad</h3>
              {insights.priorityStats.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Sin datos</p>
              ) : (
                <div className="space-y-3">
                  {insights.priorityStats.map((stat) => {
                    const maxCount = Math.max(...insights.priorityStats.map(s => s.count));
                    const percentage = maxCount > 0 ? (stat.count / maxCount) * 100 : 0;
                    const colors = {
                      urgent: 'bg-red-500',
                      high: 'bg-orange-500',
                      medium: 'bg-yellow-500',
                      low: 'bg-green-500',
                    };
                    return (
                      <div key={stat.priority}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700 capitalize">{({ low: 'Baja', medium: 'Media', high: 'Alta', urgent: 'Urgente' })[stat.priority] || stat.priority}</span>
                          <span className="text-gray-500">{stat.count}</span>
                        </div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${colors[stat.priority] || 'bg-gray-500'} rounded-full`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recent Trends */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Tendencia de 7 días</h3>
            <div className="h-48 flex items-end space-x-2">
              {insights.recentTrends.length === 0 ? (
                <div className="w-full text-center text-gray-500">Sin datos</div>
              ) : (
                insights.recentTrends.map((day) => {
                  const maxCount = Math.max(...insights.recentTrends.map(d => d.count));
                  const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-indigo-500 rounded-t"
                        style={{ height: `${height}%` }}
                        title={`${day.date}: ${day.count} tickets`}
                      />
                      <div className="text-xs text-gray-500 mt-2">
                        {new Date(day.date).toLocaleDateString('es-CO', { weekday: 'short' })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      {/* AI Categorization Test */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Prueba de clasificación automática</h3>
        <p className="text-sm text-gray-600 mb-4">
          Comprueba cómo clasificaría la IA un ticket a partir de su título y descripción.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input
              type="text"
              value={testData.title}
              onChange={(e) => setTestData({ ...testData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Ej.: No me conecto al WiFi"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={testData.description}
              onChange={(e) => setTestData({ ...testData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Ej.: Mi portátil no se conecta a la red WiFi de la oficina…"
            />
          </div>
          <button
            onClick={handleCategorize}
            disabled={!testData.title}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            Analizar con IA
          </button>
        </div>

        {categorizeResult && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-3">Resultado del análisis</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Categoría</p>
                <p className="font-medium text-gray-800 capitalize">{categorizeResult.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Prioridad</p>
                <p className="font-medium text-gray-800 capitalize">{({ low: 'Baja', medium: 'Media', high: 'Alta', urgent: 'Urgente' })[categorizeResult.priority] || categorizeResult.priority}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Confianza</p>
                <p className="font-medium text-gray-800">
                  {Math.round(categorizeResult.confidence * 100)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Palabras clave</p>
                <div className="flex flex-wrap gap-1">
                  {categorizeResult.keywords.map((kw, i) => (
                    <span key={i} className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs rounded">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            {categorizeResult.suggestedSolution && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm font-medium text-green-800">Solución sugerida:</p>
                <p className="text-sm text-green-700 mt-1">{categorizeResult.suggestedSolution}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AiInsights;
