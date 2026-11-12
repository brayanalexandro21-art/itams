import { useState, useEffect } from 'react';
import api from '../services/api';

function ApiKeys() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    permissions: ['read'],
    expires_at: '',
  });

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const response = await api.get('/apikeys');
      setKeys(response.data);
    } catch (error) {
      console.error('Error fetching API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/apikeys', formData);
      setNewKey(response.data);
      setShowCreate(false);
      setFormData({ name: '', permissions: ['read'], expires_at: '' });
      fetchKeys();
    } catch (error) {
      console.error('Error creating API key:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Seguro que deseas eliminar esta clave API?')) {
      try {
        await api.delete(`/apikeys/${id}`);
        fetchKeys();
      } catch (error) {
        console.error('Error deleting API key:', error);
      }
    }
  };

  const togglePermission = (perm) => {
    const current = formData.permissions;
    if (current.includes(perm)) {
      setFormData({ ...formData, permissions: current.filter(p => p !== perm) });
    } else {
      setFormData({ ...formData, permissions: [...current, perm] });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Claves API</h2>
          <p className="text-sm text-gray-500">Administra las claves de acceso para integraciones externas</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          + Crear clave API
        </button>
      </div>

      {/* New Key Alert */}
      {newKey && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <span className="text-green-500 text-xl mr-3">✓</span>
            <div className="flex-1">
              <h4 className="font-medium text-green-800">Clave API creada</h4>
              <p className="text-sm text-green-700 mt-1">
                Copia esta clave ahora. No se volverá a mostrar.
              </p>
              <div className="mt-2 p-2 bg-white rounded border font-mono text-sm break-all">
                {newKey.key}
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(newKey.key)}
                className="mt-2 text-sm text-green-700 hover:text-green-900"
              >
                Copiar al portapapeles
              </button>
            </div>
            <button
              onClick={() => setNewKey(null)}
              className="text-green-500 hover:text-green-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Create Form Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Crear clave API</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ej.: Integración con Zapier"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permisos
                </label>
                <div className="flex space-x-4">
                  {['read', 'write'].map((perm) => (
                    <label key={perm} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(perm)}
                        onChange={() => togglePermission(perm)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 capitalize">{perm === 'read' ? 'Lectura' : perm === 'write' ? 'Escritura' : perm}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vence el (opcional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* API Keys List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando…</div>
        ) : keys.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Aún no hay claves API. Crea una para empezar.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Prefijo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Permisos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Último uso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Vence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {keys.map((key) => (
                <tr key={key.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-800">
                    {key.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                    {key.key_prefix}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-1">
                      {JSON.parse(key.permissions || '[]').map((perm) => (
                        <span
                          key={perm}
                          className="px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded"
                        >
                          {perm}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {key.last_used ? new Date(key.last_used).toLocaleDateString('es-CO') : 'Nunca'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {key.expires_at ? new Date(key.expires_at).toLocaleDateString('es-CO') : 'Nunca'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleDelete(key.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* API Documentation */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Documentación de la API</h3>
        <div className="prose text-sm">
          <p className="text-gray-600 mb-4">
            Usa las claves API para acceder a ITAMS desde otros sistemas. Envía la clave en el encabezado <code>X-API-Key</code>.
          </p>
          <h4 className="font-medium text-gray-800">Endpoints disponibles</h4>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li><code>GET /api/v1/tickets</code> - Listar tickets (permiso de lectura)</li>
            <li><code>GET /api/v1/assets</code> - Listar activos (permiso de lectura)</li>
            <li><code>POST /api/v1/tickets</code> - Crear ticket (permiso de escritura)</li>
          </ul>
          <h4 className="font-medium text-gray-800 mt-4">Ejemplo de solicitud</h4>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`curl -H "X-API-Key: tu_clave_api" \\
     http://localhost:3001/api/v1/tickets`}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default ApiKeys;
