import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Icono, IconoTitulo } from '../components/Icono';

const OnboardingGuide = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get('/onboarding-management/progress');
      setData(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeStep = async (stepId) => {
    try {
      await api.post(`/onboarding-management/step/${stepId}`);
      fetchData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const resetOnboarding = async () => {
    try {
      await api.post('/onboarding-management/reset');
      fetchData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  const completedCount = data?.steps?.filter(s => s.completed).length || 0;
  const totalCount = data?.steps?.length || 8;
  const progress = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-3"><IconoTitulo e="🚀" />Guía de Bienvenida</h1>
        <button onClick={resetOnboarding} className="text-gray-500 text-sm hover:text-red-500">Reiniciar onboarding</button>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Tu Progreso</h2>
          <span className="text-sm text-gray-500">{completedCount}/{totalCount} pasos</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div className="bg-blue-500 h-4 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-sm text-gray-500 mt-2">{progress}% completado</p>
        {data?.completed && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            ¡Felicidades! Has completado toda la guía de bienvenida.
          </div>
        )}
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data?.steps?.map(step => (
          <div
            key={step.id}
            className={`rounded-lg shadow p-6 transition-all ${step.completed ? 'bg-green-50 border-2 border-green-200' : 'bg-white'}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl"><Icono e={step.icon} className="h-8 w-8" /></span>
                <div>
                  <h3 className="font-semibold">{step.name}</h3>
                  <p className="text-sm text-gray-500">{step.description}</p>
                </div>
              </div>
              {step.completed ? (
                <span className="text-green-500 text-2xl">✓</span>
              ) : (
                <button
                  onClick={() => completeStep(step.id)}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                >
                  Completar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OnboardingGuide;