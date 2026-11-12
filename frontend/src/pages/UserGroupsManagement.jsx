import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { IconoTitulo } from '../components/Icono';

const UserGroupsManagement = () => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await api.get('/user-groups-management');
      setGroups(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async (groupId) => {
    try {
      const [membersRes, usersRes] = await Promise.all([
        api.get(`/user-groups-management/${groupId}/members`),
        api.get('/users')
      ]);
      setMembers(membersRes.data);
      setAllUsers(usersRes.data);
      setSelectedGroup(groupId);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const createGroup = async () => {
    if (!newGroup.name.trim()) return;
    try {
      await api.post('/user-groups-management', newGroup);
      setNewGroup({ name: '', description: '' });
      setShowCreate(false);
      fetchGroups();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const deleteGroup = async (id) => {
    if (!confirm('¿Eliminar este grupo?')) return;
    try {
      await api.delete(`/user-groups-management/${id}`);
      setSelectedGroup(null);
      fetchGroups();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const addMember = async (userId) => {
    try {
      await api.post(`/user-groups-management/${selectedGroup}/members`, { user_id: userId });
      fetchMembers(selectedGroup);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const removeMember = async (userId) => {
    try {
      await api.delete(`/user-groups-management/${selectedGroup}/members/${userId}`);
      fetchMembers(selectedGroup);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-3"><IconoTitulo e="👥" />Gestión de Grupos de Usuarios</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          + Nuevo Grupo
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Crear Grupo</h2>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              value={newGroup.name}
              onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
              placeholder="Nombre del grupo"
              className="border rounded px-3 py-2"
            />
            <input
              type="text"
              value={newGroup.description}
              onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
              placeholder="Descripción"
              className="border rounded px-3 py-2"
            />
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={createGroup} className="bg-green-500 text-white px-4 py-2 rounded">Crear</button>
            <button onClick={() => setShowCreate(false)} className="bg-gray-300 px-4 py-2 rounded">Cancelar</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Grupos</h2>
          <div className="space-y-2">
            {groups.map(group => (
              <div
                key={group.id}
                onClick={() => fetchMembers(group.id)}
                className={`p-3 rounded-lg cursor-pointer ${selectedGroup === group.id ? 'bg-blue-100' : 'bg-gray-50 hover:bg-gray-100'}`}
              >
                <div className="font-medium">{group.name}</div>
                <div className="text-sm text-gray-500">{group.member_count} miembros</div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          {selectedGroup ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Miembros del Grupo</h2>
                <button onClick={() => deleteGroup(selectedGroup)} className="bg-red-500 text-white px-3 py-1 rounded text-sm">Eliminar Grupo</button>
              </div>
              <div className="space-y-2 mb-4">
                {members.map(member => (
                  <div key={member.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium">{member.name}</span>
                      <span className="text-sm text-gray-500 ml-2">{member.email}</span>
                    </div>
                    <button onClick={() => removeMember(member.id)} className="text-red-500 text-sm">Remover</button>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Agregar Miembro</h3>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {allUsers.filter(u => !members.find(m => m.id === u.id)).map(user => (
                    <button
                      key={user.id}
                      onClick={() => addMember(user.id)}
                      className="text-left p-2 text-sm bg-blue-50 hover:bg-blue-100 rounded"
                    >
                      {user.name}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 py-12">Selecciona un grupo</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserGroupsManagement;