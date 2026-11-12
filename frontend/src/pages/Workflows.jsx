import { useState, useEffect } from 'react';
import api from '../services/api';

function Workflows() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger_event: 'ticket_created',
    conditions: [],
    actions: [],
  });

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const response = await api.get('/workflows');
      setWorkflows(response.data);
    } catch (error) {
      console.error('Error fetching workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/workflows', formData);
      setShowCreate(false);
      setFormData({ name: '', description: '', trigger_event: 'ticket_created', conditions: [], actions: [] });
      fetchWorkflows();
    } catch (error) {
      console.error('Error creating workflow:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Seguro que deseas eliminar este flujo de trabajo?')) {
      try {
        await api.delete(`/workflows/${id}`);
        fetchWorkflows();
      } catch (error) {
        console.error('Error deleting workflow:', error);
      }
    }
  };

  const handleExecute = async (id) => {
    try {
      await api.post(`/workflows/${id}/execute`);
      alert('Flujo de trabajo ejecutado correctamente');
    } catch (error) {
      console.error('Error executing workflow:', error);
    }
  };

  const getTriggerLabel = (trigger) => {
    const labels = {
      ticket_created: 'Ticket creado',
      ticket_updated: 'Ticket actualizado',
      ticket_assigned: 'Ticket asignado',
      status_changed: 'Cambio de estado',
    };
    return labels[trigger] || trigger;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Flujos de trabajo</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          + Crear flujo
        </button>
      </div>

      {/* Workflow List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 text-center py-8 text-gray-500">Cargando…</div>
        ) : workflows.length === 0 ? (
          <div className="col-span-2 text-center py-8 text-gray-500">
            No hay flujos configurados. Crea uno para automatizar tus procesos.
          </div>
        ) : (
          workflows.map((workflow) => (
            <div key={workflow.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">{workflow.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{workflow.description}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${workflow.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {workflow.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {/* Trigger */}
                <div className="flex items-center text-sm">
                  <span className="w-20 text-gray-500">Disparador:</span>
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded">
                    {getTriggerLabel(workflow.trigger_event)}
                  </span>
                </div>

                {/* Conditions */}
                {workflow.conditions && JSON.parse(workflow.conditions).length > 0 && (
                  <div className="text-sm">
                    <span className="text-gray-500">Condiciones:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {JSON.parse(workflow.conditions).map((cond, i) => (
                        <span key={i} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                          {cond.field} {cond.operator} {cond.value}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {workflow.actions && JSON.parse(workflow.actions).length > 0 && (
                  <div className="text-sm">
                    <span className="text-gray-500">Acciones:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {JSON.parse(workflow.actions).map((action, i) => (
                        <span key={i} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                          {action.type}: {action.value || action.title || ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => handleExecute(workflow.id)}
                  className="px-3 py-1 text-sm bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200"
                >
                  Ejecutar
                </button>
                <button
                  onClick={() => handleDelete(workflow.id)}
                  className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Crear flujo de trabajo</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ej.: Asignar automáticamente los tickets urgentes"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Evento disparador *</label>
                <select
                  value={formData.trigger_event}
                  onChange={(e) => setFormData({ ...formData, trigger_event: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ticket_created">Ticket creado</option>
                  <option value="ticket_updated">Ticket actualizado</option>
                  <option value="ticket_assigned">Ticket asignado</option>
                  <option value="status_changed">Cambio de estado</option>
                </select>
              </div>

              {/* Simple Conditions */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-700 mb-2">Condiciones (opcional)</h4>
                <p className="text-xs text-gray-500 mb-2">Agrega las condiciones que deben cumplirse para que el flujo se ejecute</p>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    className="px-2 py-1 border rounded text-sm"
                    onChange={(e) => {
                      const conditions = [...formData.conditions];
                      conditions[0] = { ...conditions[0], field: e.target.value };
                      setFormData({ ...formData, conditions });
                    }}
                  >
                    <option value="">Campo</option>
                    <option value="priority">Prioridad</option>
                    <option value="status">Estado</option>
                    <option value="category">Categoría</option>
                  </select>
                  <select
                    className="px-2 py-1 border rounded text-sm"
                    onChange={(e) => {
                      const conditions = [...formData.conditions];
                      conditions[0] = { ...conditions[0], operator: e.target.value };
                      setFormData({ ...formData, conditions });
                    }}
                  >
                    <option value="">Operador</option>
                    <option value="equals">Es igual a</option>
                    <option value="not_equals">Es distinto de</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Valor"
                    className="px-2 py-1 border rounded text-sm"
                    onChange={(e) => {
                      const conditions = [...formData.conditions];
                      conditions[0] = { ...conditions[0], value: e.target.value };
                      setFormData({ ...formData, conditions });
                    }}
                  />
                </div>
              </div>

              {/* Simple Actions */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-700 mb-2">Acciones</h4>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    className="px-2 py-1 border rounded text-sm"
                    onChange={(e) => {
                      const actions = [...formData.actions];
                      actions[0] = { ...actions[0], type: e.target.value };
                      setFormData({ ...formData, actions });
                    }}
                  >
                    <option value="">Tipo de acción</option>
                    <option value="assign">Asignar a</option>
                    <option value="set_priority">Cambiar prioridad</option>
                    <option value="set_status">Cambiar estado</option>
                    <option value="add_comment">Agregar comentario</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Valor"
                    className="px-2 py-1 border rounded text-sm"
                    onChange={(e) => {
                      const actions = [...formData.actions];
                      actions[0] = { ...actions[0], value: e.target.value };
                      setFormData({ ...formData, actions });
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-4">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-700">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Workflows;
