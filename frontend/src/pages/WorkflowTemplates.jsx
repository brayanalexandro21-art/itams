import React, { useState, useEffect } from 'react';
import api from '../services/api';

const WorkflowTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/workflow-advanced/templates-v2');
      setTemplates(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeWorkflow = async (template) => {
    try {
      await api.post('/workflow-advanced/execute-manual', {
        template_id: template.id,
        context: {}
      });
      alert(`Workflow "${template.name}" ejecutado`);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">⚡ Plantillas de Workflows</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(template => (
          <div key={template.id} className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-2">{template.name}</h2>
            <p className="text-gray-600 text-sm mb-4">{template.description}</p>
            
            <div className="space-y-2 mb-4">
              <div className="text-sm">
                <span className="font-medium">Trigger:</span> {template.trigger}
              </div>
              {template.conditions?.length > 0 && (
                <div className="text-sm">
                  <span className="font-medium">Condiciones:</span>
                  <ul className="list-disc list-inside text-gray-600">
                    {template.conditions.map((c, i) => (
                      <li key={i}>{c.field} {c.operator} {c.value}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="text-sm">
                <span className="font-medium">Acciones:</span>
                <ul className="list-disc list-inside text-gray-600">
                  {template.actions?.map((a, i) => (
                    <li key={i}>{a.type}: {a.target || a.value}</li>
                  ))}
                </ul>
              </div>
            </div>

            <button
              onClick={() => executeWorkflow(template)}
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            >
              Ejecutar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkflowTemplates;