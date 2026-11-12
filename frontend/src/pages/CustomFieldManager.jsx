import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Icono, IconoTitulo } from '../components/Icono';

const CustomFieldManager = () => {
  const [fields, setFields] = useState([]);
  const [fieldTypes, setFieldTypes] = useState([]);
  const [filter, setFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newField, setNewField] = useState({ name: '', entity_type: 'tickets', field_type: 'text', options: '', required: false, sort_order: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [filter]);

  const fetchData = async () => {
    try {
      const url = filter ? `/custom-field-manager?entity=${filter}` : '/custom-field-manager';
      const [fieldsRes, typesRes] = await Promise.all([
        api.get(url),
        api.get('/custom-field-manager/types')
      ]);
      setFields(fieldsRes.data);
      setFieldTypes(typesRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createField = async () => {
    try {
      const payload = { ...newField, options: newField.options ? newField.options.split(',').map(o => o.trim()) : [] };
      await api.post('/custom-field-manager', payload);
      setShowCreate(false);
      setNewField({ name: '', entity_type: 'tickets', field_type: 'text', options: '', required: false, sort_order: 0 });
      fetchData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const deleteField = async (id) => {
    if (!confirm('¿Eliminar este campo personalizado?')) return;
    try {
      await api.delete(`/custom-field-manager/${id}`);
      fetchData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getTypeIcon = (type) => fieldTypes.find(t => t.type === type)?.icon || '📝';

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-3"><IconoTitulo e="🏷️" />Gestor de Campos Personalizados</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          + Nuevo Campo
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Crear Campo Personalizado</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input type="text" value={newField.name} onChange={(e) => setNewField({...newField, name: e.target.value})} placeholder="Nombre del campo" className="border rounded px-3 py-2" />
            <select value={newField.entity_type} onChange={(e) => setNewField({...newField, entity_type: e.target.value})} className="border rounded px-3 py-2">
              <option value="tickets">Tickets</option>
              <option value="assets">Activos</option>
              <option value="users">Usuarios</option>
            </select>
            <select value={newField.field_type} onChange={(e) => setNewField({...newField, field_type: e.target.value})} className="border rounded px-3 py-2">
              {fieldTypes.map(t => <option key={t.type} value={t.type}>{t.name}</option>)}
            </select>
            <input type="text" value={newField.options} onChange={(e) => setNewField({...newField, options: e.target.value})} placeholder="Opciones (separadas por coma)" className="border rounded px-3 py-2" disabled={!['select', 'multiselect'].includes(newField.field_type)} />
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={newField.required} onChange={(e) => setNewField({...newField, required: e.target.checked})} />
              <span className="text-sm">Requerido</span>
            </label>
            <input type="number" value={newField.sort_order} onChange={(e) => setNewField({...newField, sort_order: parseInt(e.target.value)})} placeholder="Orden" className="border rounded px-3 py-2" />
          </div>
          <div className="flex gap-2">
            <button onClick={createField} className="bg-green-500 text-white px-4 py-2 rounded">Crear</button>
            <button onClick={() => setShowCreate(false)} className="bg-gray-300 px-4 py-2 rounded">Cancelar</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border rounded px-3 py-2 text-sm">
            <option value="">Todas las entidades</option>
            <option value="tickets">Tickets</option>
            <option value="assets">Activos</option>
            <option value="users">Usuarios</option>
          </select>
        </div>
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entidad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requerido</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {fields.map(f => (
              <tr key={f.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{f.name}</td>
                <td className="px-6 py-4 text-sm"><Icono e={getTypeIcon(f.field_type)} className="h-5 w-5" /> {f.field_type}</td>
                <td className="px-6 py-4 text-sm capitalize">{f.entity_type}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-0.5 rounded ${f.required ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}`}>
                    {f.required ? 'Sí' : 'No'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => deleteField(f.id)} className="text-red-600 text-sm hover:underline">Eliminar</button>
                </td>
              </tr>
            ))}
            {fields.length === 0 && (
              <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">No hay campos personalizados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomFieldManager;