import React, { useState, useEffect } from 'react';
import api from '../services/api';

const InlineDropdown = ({ label, apiPath, value, onChange, required, fetchPath, createPath, fields }) => {
  const [options, setOptions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newItem, setNewItem] = useState({});
  const [loading, setLoading] = useState(false);

  // Soporte para rutas personalizadas (ej: usuarios)
  const listUrl = fetchPath || `/asset-dropdowns/${apiPath}`;
  const createUrl = createPath || `/asset-dropdowns/${apiPath}`;

  // Campos del formulario del modal (por defecto solo "name")
  const modalFields = fields || [{ key: 'name', label: 'Nombre', type: 'text' }];

  useEffect(() => { fetchOptions(); }, [listUrl]);

  const fetchOptions = async () => {
    try {
      const response = await api.get(listUrl);
      setOptions(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const createItem = async () => {
    // Validar campos requeridos
    const nameField = modalFields[0];
    if (nameField && !newItem[nameField.key]?.trim()) return;
    setLoading(true);
    try {
      const response = await api.post(createUrl, newItem);
      setNewItem({});
      setShowModal(false);
      await fetchOptions();
      onChange(response.data.id || response.data.user?.id);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const getLabel = (opt) => {
    // Para usuarios: mostrar nombre + email
    if (opt.email) return `${opt.name} (${opt.email})`;
    return opt.name;
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-1">
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
          className="flex-1 border rounded px-3 py-2 text-sm"
          required={required}
        >
          <option value="">---</option>
          {options.map(opt => (
            <option key={opt.id} value={opt.id}>{getLabel(opt)}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-bold shrink-0"
          title={`Agregar nuevo ${label}`}
        >
          +
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Nuevo {label}</h3>
            <div className="space-y-3">
              {modalFields.map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                  {field.type === 'select' ? (
                    <select
                      value={newItem[field.key] || ''}
                      onChange={(e) => setNewItem({ ...newItem, [field.key]: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="">Seleccionar...</option>
                      {field.options?.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type || 'text'}
                      value={newItem[field.key] || ''}
                      onChange={(e) => setNewItem({ ...newItem, [field.key]: e.target.value })}
                      onKeyPress={(e) => e.key === 'Enter' && createItem()}
                      placeholder={field.placeholder || ''}
                      className="w-full border rounded px-3 py-2"
                      autoFocus={field.key === modalFields[0].key}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => { setShowModal(false); setNewItem({}); }} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
                Cancelar
              </button>
              <button onClick={createItem} disabled={loading} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50">
                {loading ? 'Creando...' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InlineDropdown;