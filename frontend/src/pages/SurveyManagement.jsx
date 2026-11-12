import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { IconoTitulo } from '../components/Icono';

const SurveyManagement = () => {
  const [surveys, setSurveys] = useState([]);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newSurvey, setNewSurvey] = useState({
    title: '', description: '',
    questions: [{ question: '', type: 'rating', options: [] }]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      const response = await api.get('/survey-management');
      setSurveys(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSurvey = async (id) => {
    try {
      const response = await api.get(`/survey-management/${id}`);
      setSelectedSurvey(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const createSurvey = async () => {
    try {
      await api.post('/survey-management', newSurvey);
      setShowCreate(false);
      setNewSurvey({ title: '', description: '', questions: [{ question: '', type: 'rating', options: [] }] });
      fetchSurveys();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const publishSurvey = async (id) => {
    try {
      await api.post(`/survey-management/${id}/publish`);
      fetchSurvey(id);
      fetchSurveys();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const addQuestion = () => {
    setNewSurvey({...newSurvey, questions: [...newSurvey.questions, { question: '', type: 'rating', options: [] }]});
  };

  const updateQuestion = (index, field, value) => {
    const questions = [...newSurvey.questions];
    questions[index] = {...questions[index], [field]: value};
    setNewSurvey({...newSurvey, questions});
  };

  const removeQuestion = (index) => {
    setNewSurvey({...newSurvey, questions: newSurvey.questions.filter((_, i) => i !== index)});
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-3"><IconoTitulo e="📝" />Gestión de Encuestas</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          + Nueva Encuesta
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Crear Encuesta</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input type="text" value={newSurvey.title} onChange={(e) => setNewSurvey({...newSurvey, title: e.target.value})} placeholder="Título" className="border rounded px-3 py-2" />
            <input type="text" value={newSurvey.description} onChange={(e) => setNewSurvey({...newSurvey, description: e.target.value})} placeholder="Descripción" className="border rounded px-3 py-2" />
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Preguntas</h3>
              <button onClick={addQuestion} className="text-blue-600 text-sm">+ Agregar pregunta</button>
            </div>
            {newSurvey.questions.map((q, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input type="text" value={q.question} onChange={(e) => updateQuestion(i, 'question', e.target.value)} placeholder="Pregunta" className="flex-1 border rounded px-3 py-1 text-sm" />
                <select value={q.type} onChange={(e) => updateQuestion(i, 'type', e.target.value)} className="border rounded px-2 py-1 text-sm">
                  <option value="rating">Calificación (1-5)</option>
                  <option value="text">Texto libre</option>
                  <option value="multiple_choice">Opción múltiple</option>
                  <option value="yes_no">Sí/No</option>
                </select>
                {newSurvey.questions.length > 1 && <button onClick={() => removeQuestion(i)} className="text-red-500 text-sm">X</button>}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={createSurvey} className="bg-green-500 text-white px-4 py-2 rounded">Crear</button>
            <button onClick={() => setShowCreate(false)} className="bg-gray-300 px-4 py-2 rounded">Cancelar</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Encuestas</h2>
          <div className="space-y-2">
            {surveys.map(survey => (
              <div
                key={survey.id}
                onClick={() => fetchSurvey(survey.id)}
                className={`p-3 rounded-lg cursor-pointer ${selectedSurvey?.id === survey.id ? 'bg-blue-100' : 'bg-gray-50 hover:bg-gray-100'}`}
              >
                <div className="font-medium">{survey.title}</div>
                <div className="text-sm text-gray-500">{survey.response_count} respuestas</div>
                <div className={`text-xs mt-1 ${survey.status === 'active' ? 'text-green-600' : 'text-gray-400'}`}>
                  {survey.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          {selectedSurvey ? (
            <>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-semibold">{selectedSurvey.title}</h2>
                  <p className="text-gray-500 text-sm">{selectedSurvey.description}</p>
                </div>
                {selectedSurvey.status === 'draft' && (
                  <button onClick={() => publishSurvey(selectedSurvey.id)} className="bg-green-500 text-white px-3 py-1 rounded text-sm">Publicar</button>
                )}
              </div>

              <div className="border-t pt-4 mb-4">
                <h3 className="font-medium mb-2">Preguntas ({selectedSurvey.questions?.length || 0})</h3>
                <div className="space-y-2">
                  {selectedSurvey.questions?.map((q, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded">
                      <div className="flex justify-between">
                        <span className="font-medium">{q.question}</span>
                        <span className="text-xs text-gray-400 capitalize">{q.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Respuestas ({selectedSurvey.responses?.length || 0})</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedSurvey.responses?.map((r, i) => (
                    <div key={i} className="p-2 bg-gray-50 rounded text-sm">
                      <span className="font-medium">{r.respondent_name}</span>
                      <span className="text-gray-500 ml-2">{new Date(r.submitted_at).toLocaleDateString('es-CO')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 py-12">Selecciona una encuesta</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SurveyManagement;