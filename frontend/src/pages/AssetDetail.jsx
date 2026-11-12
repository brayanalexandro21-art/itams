import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import InlineDropdown from '../components/InlineDropdown';

function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dropdown data
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [models, setModels] = useState([]);
  const [modelPhotos, setModelPhotos] = useState(null);

  // Form editable
  const [form, setForm] = useState({
    name: '', status_id: '', location_id: '', type_id: '', manufacturer_id: '',
    responsible_group_id: '', model_id: '', user_id: '', group_id: '',
    network_id: '', update_source_id: '', alt_username_number: '', serial_number: '',
    alt_username: '', inventory_number: '', uuid: '', comments: '',
    status: '', type: '', category: '', purchase_date: '', warranty_expiry: '',
  });

  useEffect(() => { fetchAll(); }, [id]);

  const fetchAll = async () => {
    try {
      const [assetRes, usersRes, groupsRes, modelsRes] = await Promise.all([
        api.get(`/assets/${id}`),
        api.get('/users'),
        api.get('/user-groups'),
        api.get('/computer-models'),
      ]);
      setAsset(assetRes.data);
      setUsers(usersRes.data);
      setGroups(groupsRes.data);
      setModels(modelsRes.data);

      const a = assetRes.data;
      setForm({
        name: a.name || '', status_id: a.status_id || '', location_id: a.location_id || '',
        type_id: a.type_id || '', manufacturer_id: a.manufacturer_id || '',
        responsible_group_id: a.responsible_group_id || '', model_id: a.model_id || '',
        user_id: a.assigned_to || '', group_id: a.group_id || '',
        network_id: a.network_id || '', update_source_id: a.update_source_id || '',
        alt_username_number: a.alt_username_number || '', serial_number: a.serial_number || '',
        alt_username: a.alt_username || '', inventory_number: a.inventory_number || '',
        uuid: a.uuid || '', comments: a.notes || '',
        status: a.status || '', type: a.type || '', category: a.category || '',
        purchase_date: a.purchase_date || '', warranty_expiry: a.warranty_expiry || '',
      });

      // Cargar fotos del modelo
      if (a.model_id) {
        try {
          const modelRes = await api.get(`/computer-models/${a.model_id}`);
          setModelPhotos(modelRes.data);
        } catch (e) {}
      }
    } catch (error) {
      console.error('Error:', error);
      navigate('/assets');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/assets/${id}`, {
        name: form.name,
        assigned_to: form.user_id || null,
        status_id: form.status_id || null,
        location_id: form.location_id || null,
        type_id: form.type_id || null,
        manufacturer_id: form.manufacturer_id || null,
        model_id: form.model_id || null,
        network_id: form.network_id || null,
        update_source_id: form.update_source_id || null,
        responsible_group_id: form.responsible_group_id || null,
        group_id: form.group_id || null,
        alt_username_number: form.alt_username_number,
        serial_number: form.serial_number,
        alt_username: form.alt_username,
        inventory_number: form.inventory_number,
        uuid: form.uuid,
        notes: form.comments,
        purchase_date: form.purchase_date || null,
        warranty_expiry: form.warranty_expiry || null,
      });
      alert('Guardado correctamente');
      fetchAll();
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Enviar este activo a la papelera?')) return;
    try {
      await api.delete(`/assets/${id}`);
      navigate('/assets');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Cargando activo...</div></div>;
  if (!asset) return null;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
        <Link to="/assets" className="hover:text-gray-700">💻 Activos</Link>
        <span>/</span>
        <span className="font-medium text-gray-700">Computadora - {asset.name} - ID {asset.id}</span>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">💻 Computadora - {asset.name} - ID {asset.id}</h2>
        <div className="flex gap-2">
          <button onClick={handleDelete} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm flex items-center gap-1">
            🗑️ Enviar a la papelera
          </button>
          <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 text-sm flex items-center gap-1">
            💾 {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Formulario principal - 3 columnas */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {/* Fila 1 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input type="text" value={form.name} onChange={(e) => handleChange('name', e.target.value)} className="w-full border rounded px-3 py-2" />
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
                <InlineDropdown label="Técnico" fetchPath="/users" createPath="/auth/register"
                  value={form.user_id} onChange={(v) => handleChange('user_id', v)}
                  fields={[{ key: 'name', label: 'Nombre completo', type: 'text' }, { key: 'email', label: 'Email', type: 'email' }, { key: 'password', label: 'Contraseña', type: 'password' }]} />
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
                  <button type="button" className="w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-bold shrink-0">+</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
                <div className="flex items-center gap-1">
                  <select value={form.model_id || ''} onChange={(e) => handleChange('model_id', e.target.value || null)} className="flex-1 border rounded px-3 py-2">
                    <option value="">---</option>
                    {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                  <button type="button" className="w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-bold shrink-0">+</button>
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
                <InlineDropdown label="Usuario" fetchPath="/users" createPath="/auth/register"
                  value={form.user_id} onChange={(v) => handleChange('user_id', v)}
                  fields={[{ key: 'name', label: 'Nombre completo', type: 'text' }, { key: 'email', label: 'Email', type: 'email' }, { key: 'password', label: 'Contraseña', type: 'password' }]} />
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
                  <button type="button" className="w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-bold shrink-0">+</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">UUID</label>
                <input type="text" value={form.uuid} onChange={(e) => handleChange('uuid', e.target.value)} className="w-full border rounded px-3 py-2" placeholder="UUID" />
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

          {/* Timestamps */}
          <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
            <span>Creado el {new Date(asset.created_at).toLocaleString('es-CO')}</span>
            <span>Última actualización el {new Date(asset.updated_at).toLocaleString('es-CO')}</span>
          </div>
        </div>

        {/* Panel de fotos - 1 columna */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-800 mb-4">📸 Fotos</h3>
            {modelPhotos?.photo_front ? (
              <div className="space-y-4">
                <div>
                  <img src={modelPhotos.photo_front} alt="Cuadro delantero" className="w-full rounded-lg" />
                  <p className="text-xs text-gray-400 mt-1 italic">Cuadro delantero</p>
                </div>
                {modelPhotos.photo_back && (
                  <div>
                    <img src={modelPhotos.photo_back} alt="Cuadro posterior" className="w-full rounded-lg" />
                    <p className="text-xs text-gray-400 mt-1 italic">Cuadro posterior</p>
                  </div>
                )}
                {modelPhotos.other_photos && modelPhotos.other_photos.split(',').filter(Boolean).map((photo, i) => (
                  <div key={i}>
                    <img src={photo} alt={`Foto ${i + 1}`} className="w-full rounded-lg" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p className="text-4xl mb-2">📷</p>
                <p className="text-sm">Sin fotos</p>
                <p className="text-xs">Asigna un modelo con fotos</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AssetDetail;