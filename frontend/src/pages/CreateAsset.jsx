import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import InlineDropdown from '../components/InlineDropdown';
import ComputerModelForm from '../components/ComputerModelForm';
import { Icono } from '../components/Icono';

const CreateAsset = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [models, setModels] = useState([]);
  const [groups, setGroups] = useState([]);

  const [form, setForm] = useState({
    name: '',
    status_id: '',
    location_id: '',
    type_id: '',
    manufacturer_id: '',
    responsible_group_id: '',
    model_id: '',
    technician_id: '',
    user_id: '',
    group_id: '',
    network_id: '',
    update_source_id: '',
    alt_username_number: '',
    serial_number: '',
    alt_username: '',
    inventory_number: '',
    uuid: '',
    comments: '',
    // Compatibilidad
    status: 'available',
    type: 'computer',
    category: 'hardware',
    purchase_date: '',
    warranty_expiry: '',
  });

  useEffect(() => { fetchDropdownData(); }, []);

  const fetchDropdownData = async () => {
    try {
      const [typesRes, modelsRes, groupsRes] = await Promise.all([
        api.get('/asset-dropdowns/types'),
        api.get('/computer-models'),
        api.get('/user-groups'),
      ]);
      setModels(modelsRes.data);
      setGroups(groupsRes.data);
    } catch (error) {
      console.error('Error loading dropdowns:', error);
    }
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        assigned_to: form.user_id || null,
      };
      const response = await api.post('/assets', payload);
      navigate(`/assets/${response.data.id}`);
    } catch (error) {
      console.error('Error creating asset:', error);
      alert('Error al crear activo: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleModelCreated = async (model) => {
    await fetchDropdownData();
    handleChange('model_id', model.id);
  };

  // Configuración de campos para el modal de crear usuario
  const userFields = [
    { key: 'name', label: 'Nombre completo', type: 'text', placeholder: 'Juan Pérez' },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'juan@empresa.com' },
    { key: 'password', label: 'Contraseña', type: 'password', placeholder: 'Mínimo 8 caracteres' },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h1 className="text-lg font-semibold text-blue-800 flex items-center gap-2">
          <Icono e="🖥️" className="h-4 w-4" /> Nuevo elemento - Computadora
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {/* Fila 1 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input type="text" value={form.name} onChange={(e) => handleChange('name', e.target.value)} className="w-full border rounded px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <InlineDropdown label="Estado" apiPath="statuses" value={form.status_id} onChange={(v) => handleChange('status_id', v)} />
            </div>

            {/* Fila 2 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ubicaciones</label>
              <InlineDropdown label="Ubicación" apiPath="locations" value={form.location_id} onChange={(v) => handleChange('location_id', v)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <InlineDropdown label="Tipo" apiPath="types" value={form.type_id} onChange={(v) => handleChange('type_id', v)} />
            </div>

            {/* Fila 3 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Técnico responsable</label>
              <InlineDropdown
                label="Técnico"
                fetchPath="/users"
                createPath="/auth/register"
                value={form.technician_id}
                onChange={(v) => handleChange('technician_id', v)}
                fields={userFields}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fabricantes</label>
              <InlineDropdown label="Fabricante" apiPath="manufacturers" value={form.manufacturer_id} onChange={(v) => handleChange('manufacturer_id', v)} />
            </div>

            {/* Fila 4 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grupo responsable</label>
              <div className="flex items-center gap-1">
                <select value={form.responsible_group_id || ''} onChange={(e) => handleChange('responsible_group_id', e.target.value || null)} className="flex-1 border rounded px-3 py-2">
                  <option value="">---</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
                <button type="button" className="w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-bold shrink-0" title="Agregar grupo">+</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
              <div className="flex items-center gap-1">
                <select value={form.model_id || ''} onChange={(e) => handleChange('model_id', e.target.value || null)} className="flex-1 border rounded px-3 py-2">
                  <option value="">---</option>
                  {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <button type="button" onClick={() => setShowModelModal(true)} className="w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-bold shrink-0" title="Crear modelo de computadora">+</button>
              </div>
            </div>

            {/* Fila 5 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de nombre de usuario alternativo</label>
              <input type="text" value={form.alt_username_number} onChange={(e) => handleChange('alt_username_number', e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de serie</label>
              <input type="text" value={form.serial_number} onChange={(e) => handleChange('serial_number', e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>

            {/* Fila 6 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de usuario alternativo</label>
              <input type="text" value={form.alt_username} onChange={(e) => handleChange('alt_username', e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de inventario</label>
              <input type="text" value={form.inventory_number} onChange={(e) => handleChange('inventory_number', e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>

            {/* Fila 7 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
              <InlineDropdown
                label="Usuario"
                fetchPath="/users"
                createPath="/auth/register"
                value={form.user_id}
                onChange={(v) => handleChange('user_id', v)}
                fields={userFields}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Red</label>
              <InlineDropdown label="Red" apiPath="networks" value={form.network_id} onChange={(v) => handleChange('network_id', v)} />
            </div>

            {/* Fila 8 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grupo</label>
              <div className="flex items-center gap-1">
                <select value={form.group_id || ''} onChange={(e) => handleChange('group_id', e.target.value || null)} className="flex-1 border rounded px-3 py-2">
                  <option value="">---</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
                <button type="button" className="w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-bold shrink-0" title="Agregar grupo">+</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">UUID</label>
              <input type="text" value={form.uuid} onChange={(e) => handleChange('uuid', e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Universally Unique Identifier" />
            </div>

            {/* Fila 9 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Comentarios</label>
              <textarea value={form.comments} onChange={(e) => handleChange('comments', e.target.value)} className="w-full border rounded px-3 py-2 h-24" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fuentes de actualización</label>
              <InlineDropdown label="Fuente de actualización" apiPath="update-sources" value={form.update_source_id} onChange={(v) => handleChange('update_source_id', v)} />
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-4 mt-6">
          <button type="button" onClick={() => navigate('/assets')} className="px-6 py-2 bg-gray-300 rounded hover:bg-gray-400">
            Cancelar
          </button>
          <button type="submit" disabled={loading} className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 font-medium">
            {loading ? 'Guardando...' : '+ Añadir'}
          </button>
        </div>
      </form>

      {showModelModal && (
        <ComputerModelForm onClose={() => setShowModelModal(false)} onCreated={handleModelCreated} />
      )}
    </div>
  );
};

export default CreateAsset;