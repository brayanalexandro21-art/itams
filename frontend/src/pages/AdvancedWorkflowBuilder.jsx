import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Icono, IconoTitulo } from '../components/Icono';

const AdvancedWorkflowBuilder = () => {
  const [nodes, setNodes] = useState({ triggers: [], conditions: [], actions: [] });
  const [workflows, setWorkflows] = useState([]);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [nodesRes, workflowsRes] = await Promise.all([
        api.get('/advanced-workflow-builder/nodes'),
        api.get('/workflows'),
      ]);
      setNodes(nodesRes.data);
      setWorkflows(workflowsRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addNode = (node, type) => {
    setSelectedNodes([...selectedNodes, { ...node, type, id: Date.now() }]);
  };

  const removeNode = (id) => {
    setSelectedNodes(selectedNodes.filter(n => n.id !== id));
  };

  const saveWorkflow = async () => {
    try {
      await api.post('/advanced-workflow-builder/save', {
        name: 'Workflow Personalizado',
        description: 'Workflow creado con el constructor visual',
        nodes: selectedNodes,
        connections: [],
      });
      alert('Workflow guardado');
      fetchData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-3"><IconoTitulo e="⚡" />Constructor de Workflows</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de nodos */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Nodos Disponibles</h2>
          
          {/* Triggers */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">TRIGGERS</h3>
            <div className="space-y-2">
              {nodes.triggers?.map(trigger => (
                <button
                  key={trigger.id}
                  onClick={() => addNode(trigger, 'trigger')}
                  className="w-full text-left p-2 bg-green-50 rounded-lg hover:bg-green-100"
                >
                  <span className="mr-2"><Icono e={trigger.icon} className="h-5 w-5" /></span>
                  {trigger.name}
                </button>
              ))}
            </div>
          </div>

          {/* Condiciones */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">CONDICIONES</h3>
            <div className="space-y-2">
              {nodes.conditions?.map(condition => (
                <button
                  key={condition.id}
                  onClick={() => addNode(condition, 'condition')}
                  className="w-full text-left p-2 bg-yellow-50 rounded-lg hover:bg-yellow-100"
                >
                  <span className="mr-2"><Icono e={condition.icon} className="h-5 w-5" /></span>
                  {condition.name}
                </button>
              ))}
            </div>
          </div>

          {/* Acciones */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">ACCIONES</h3>
            <div className="space-y-2">
              {nodes.actions?.map(action => (
                <button
                  key={action.id}
                  onClick={() => addNode(action, 'action')}
                  className="w-full text-left p-2 bg-blue-50 rounded-lg hover:bg-blue-100"
                >
                  <span className="mr-2"><Icono e={action.icon} className="h-5 w-5" /></span>
                  {action.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Canvas del workflow */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Workflow Actual</h2>
            <button
              onClick={saveWorkflow}
              disabled={selectedNodes.length === 0}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Guardar Workflow
            </button>
          </div>

          {selectedNodes.length > 0 ? (
            <div className="space-y-3">
              {selectedNodes.map((node, index) => (
                <div key={node.id} className="flex items-center gap-3">
                  {index > 0 && <span className="text-gray-400">↓</span>}
                  <div className={`flex-1 p-3 rounded-lg ${
                    node.type === 'trigger' ? 'bg-green-100 border-green-300' :
                    node.type === 'condition' ? 'bg-yellow-100 border-yellow-300' :
                    'bg-blue-100 border-blue-300'
                  } border`}>
                    <div className="flex justify-between items-center">
                      <span>
                        <span className="mr-2"><Icono e={node.icon} className="h-5 w-5" /></span>
                        {node.name}
                      </span>
                      <button
                        onClick={() => removeNode(node.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p>Arrastra nodos desde el panel izquierdo para construir tu workflow</p>
            </div>
          )}
        </div>
      </div>

      {/* Workflows guardados */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Workflows Guardados</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {workflows.map(workflow => (
            <div key={workflow.id} className="p-4 border rounded-lg">
              <h3 className="font-medium">{workflow.name}</h3>
              <p className="text-sm text-gray-500">{workflow.description}</p>
              <div className="mt-2 flex gap-2">
                <button className="text-sm text-blue-500 hover:text-blue-700">Editar</button>
                <button className="text-sm text-green-500 hover:text-green-700">Ejecutar</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdvancedWorkflowBuilder;