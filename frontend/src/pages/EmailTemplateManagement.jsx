import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { IconoTitulo } from '../components/Icono';

const EmailTemplateManagement = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '', subject: '', body: '', category: 'general'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/email-template-management');
      setTemplates(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplate = async (id) => {
    try {
      const response = await api.get(`/email-template-management/${id}`);
      setSelectedTemplate(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const createTemplate = async () => {
    try {
      await api.post('/email-template-management', newTemplate);
      setShowCreate(false);
      setNewTemplate({ name: '', subject: '', body: '', category: 'general' });
      fetchTemplates();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const updateTemplate = async () => {
    try {
      await api.put(`/email-template-management/${selectedTemplate.id}`, selectedTemplate);
      fetchTemplates();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const deleteTemplate = async (id) => {
    if (!confirm('¿Eliminar esta plantilla?')) return;
    try {
      await api.delete(`/email-template-management/${id}`);
      setSelectedTemplate(null);
      fetchTemplates();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const duplicateTemplate = async (id) => {
    try {
      await api.post(`/email-template-management/${id}/duplicate`);
      fetchTemplates();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-3"><IconoTitulo e="📧" />Plantillas de Email</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          + Nueva Plantilla
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Crear Plantilla</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input type="text" value={newTemplate.name} onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})} placeholder="Nombre" className="border rounded px-3 py-2" />
            <select value={newTemplate.category} onChange={(e) => setNewTemplate({...newTemplate, category: e.target.value})} className="border rounded px-3 py-2">
              <option value="general">General</option>
              <option value="ticket">Ticket</option>
              <option value="notification">Notificación</option>
              <option value="welcome">Bienvenida</option>
            </select>
            <input type="text" value={newTemplate.subject} onChange={(e) => setNewTemplate({...newTemplate, subject: e.target.value})} placeholder="Asunto" className="border rounded px-3 py-2 col-span-2" />
            <textarea value={newTemplate.body} onChange={(e) => setNewTemplate({...newTemplate, body: e.target.value})} placeholder="Cuerpo del email (HTML permitido)" className="border rounded px-3 py-2 col-span-2 h-40 font-mono text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={createTemplate} className="bg-green-500 text-white px-4 py-2 rounded">Crear</button>
            <button onClick={() => setShowCreate(false)} className="bg-gray-300 px-4 py-2 rounded">Cancelar</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Plantillas ({templates.length})</h2>
          <div className="space-y-2">
            {templates.map(tmpl => (
              <div
                key={tmpl.id}
                onClick={() => fetchTemplate(tmpl.id)}
                className={`p-3 rounded-lg cursor-pointer ${selectedTemplate?.id === tmpl.id ? 'bg-blue-100' : 'bg-gray-50 hover:bg-gray-100'}`}
              >
                <div className="font-medium">{tmpl.name}</div>
                <div className="text-xs text-gray-500 capitalize">{tmpl.category}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          {selectedTemplate ? (
            <>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-semibold">{selectedTemplate.name}</h2>
                  <p className="text-sm text-gray-500">Asunto: {selectedTemplate.subject}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => duplicateTemplate(selectedTemplate.id)} className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm">Duplicar</button>
                  <button onClick={() => deleteTemplate(selectedTemplate.id)} className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm">Eliminar</button>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Asunto</label>
                <input type="text" value={selectedTemplate.subject} onChange={(e) => setSelectedTemplate({...selectedTemplate, subject: e.target.value})} className="w-full border rounded px-3 py-2" />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Cuerpo</label>
                <textarea value={selectedTemplate.body} onChange={(e) => setSelectedTemplate({...selectedTemplate, body: e.target.value})} className="w-full border rounded px-3 py-2 h-48 font-mono text-sm" />
              </div>

              <button onClick={updateTemplate} className="bg-green-500 text-white px-4 py-2 rounded">Guardar Cambios</button>
            </>
          ) : (
            <div className="text-center text-gray-500 py-12">Selecciona una plantilla</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailTemplateManagement;