import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { IconoTitulo } from '../components/Icono';

const RoleManager = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', description: '', permissions: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [rolesRes, permRes] = await Promise.all([
        api.get('/role-manager'),
        api.get('/role-manager/permissions')
      ]);
      setRoles(rolesRes.data);
      setPermissions(permRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRole = async () => {
    try {
      await api.post('/role-manager', newRole);
      setShowCreate(false);
      setNewRole({ name: '', description: '', permissions: [] });
      fetchData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const deleteRole = async (id) => {
    if (!confirm('¿Eliminar este rol?')) return;
    try {
      await api.delete(`/role-manager/${id}`);
      setSelectedRole(null);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Error');
    }
  };

  const togglePerm = (perm) => {
    const perms = newRole.permissions.includes(perm)
      ? newRole.permissions.filter(p => p !== perm)
      : [...newRole.permissions, perm];
    setNewRole({ ...newRole, permissions: perms });
  };

  const grouped = permissions.reduce((acc, p) => {
    const [group] = p.split('.');
    if (!acc[group]) acc[group] = [];
    acc[group].push(p);
    return acc;
  }, {});

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-3"><IconoTitulo e="🔐" />Gestor de Roles</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          + Nuevo Rol
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Crear Rol</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input type="text" value={newRole.name} onChange={(e) => setNewRole({...newRole, name: e.target.value})} placeholder="Nombre del rol" className="border rounded px-3 py-2" />
            <input type="text" value={newRole.description} onChange={(e) => setNewRole({...newRole, description: e.target.value})} placeholder="Descripción" className="border rounded px-3 py-2" />
          </div>
          <div className="mb-4">
            <h3 className="font-medium mb-2">Permisos</h3>
            {Object.entries(grouped).map(([group, perms]) => (
              <div key={group} className="mb-3">
                <h4 className="text-sm font-medium text-gray-600 capitalize mb-1">{group}</h4>
                <div className="flex flex-wrap gap-2">
                  {perms.map(p => (
                    <label key={p} className={`px-2 py-1 rounded text-xs cursor-pointer ${newRole.permissions.includes(p) ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
                      <input type="checkbox" className="hidden" checked={newRole.permissions.includes(p)} onChange={() => togglePerm(p)} />
                      {p.split('.')[1]}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={createRole} className="bg-green-500 text-white px-4 py-2 rounded">Crear</button>
            <button onClick={() => setShowCreate(false)} className="bg-gray-300 px-4 py-2 rounded">Cancelar</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuarios</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {roles.map(role => (
              <tr key={role.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{role.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{role.description}</td>
                <td className="px-6 py-4 text-sm">{role.user_count}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-0.5 rounded ${role.is_system ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-800'}`}>
                    {role.is_system ? 'Sistema' : 'Personalizado'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {!role.is_system && (
                    <button onClick={() => deleteRole(role.id)} className="text-red-600 text-sm hover:underline">Eliminar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RoleManager;