import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { IconoTitulo } from '../components/Icono';

const TicketTemplateManager = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '', description: '', category: 'general', priority: 'medium', custom_fields: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTemplates(); }, []);

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/ticket-template-manager');
      setTemplates(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplate = async (id) => {
    try {
      const response = await api.get(`/ticket-template-manager/${id}`);
      setSelectedTemplate(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const createTemplate = async () => {
    try {
      await api.post('/ticket-template-manager', newTemplate);
      setShowCreate(false);
      setNewTemplate({ name: '', description: '', category: 'general', priority: 'medium', custom_fields: [] });
      fetchTemplates();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const duplicateTemplate = async (id) => {
    try {
      await api.post(`/ticket-template-manager/${id}/duplicate`);
      fetchTemplates();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const deleteTemplate = async (id) => {
    if (!confirm('¿Eliminar esta plantilla?')) return;
    try {
      await api.delete(`/ticket-template-manager/${id}`);
      setSelectedTemplate(null);
      fetchTemplates();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getPriorityColor = (p) => {
    switch (p) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-3"><IconoTitulo e="📋" />Gestor de Plantillas de Tickets</h1>
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
              <option value="hardware">Hardware</option>
              <option value="software">Software</option>
              <option value="network">Red</option>
              <option value="security">Seguridad</option>
            </select>
            <select value={newTemplate.priority} onChange={(e) => setNewTemplate({...newTemplate, priority: e.target.value})} className="border rounded px-3 py-2">
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="critical">Crítica</option>
            </select>
            <textarea value={newTemplate.description} onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})} placeholder="Descripción" className="border rounded px-3 py-2" rows={3} />
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
            {templates.map(t => (
              <div key={t.id} onClick={() => fetchTemplate(t.id)} className={`p-3 rounded-lg cursor-pointer ${selectedTemplate?.id === t.id ? 'bg-blue-100' : 'bg-gray-50 hover:bg-gray-100'}`}>
                <div className="font-medium">{t.name}</div>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs text-gray-500 capitalize">{t.category}</span>
                  <span className={`text-xs px-1 rounded ${getPriorityColor(t.priority)}`}>{t.priority}</span>
                </div>
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
                  <p className="text-sm text-gray-500">{selectedTemplate.description}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => duplicateTemplate(selectedTemplate.id)} className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm">Duplicar</button>
                  <button onClick={() => deleteTemplate(selectedTemplate.id)} className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm">Eliminar</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div><span className="text-gray-500">Categoría:</span> <span className="capitalize">{selectedTemplate.category}</span></div>
                <div><span className="text-gray-500">Prioridad:</span> <span className={`px-2 py-0.5 rounded ${getPriorityColor(selectedTemplate.priority)}`}>{selectedTemplate.priority}</span></div>
              </div>

              {selectedTemplate.custom_fields?.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">Campos Personalizados</h3>
                  <div className="space-y-2">
                    {selectedTemplate.custom_fields.map((f, i) => (
                      <div key={i} className="p-2 bg-gray-50 rounded text-sm">
                        <span className="font-medium">{f.name}</span> — <span className="text-gray-500">{f.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 py-12">Selecciona una plantilla</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketTemplateManager;