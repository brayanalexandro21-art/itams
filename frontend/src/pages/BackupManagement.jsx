import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { IconoTitulo } from '../components/Icono';

const BackupManagement = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    try {
      const response = await api.get('/backup-management');
      setBackups(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    setCreating(true);
    try {
      const response = await api.post('/backup-management/create');
      alert(`Backup creado: ${response.data.filename} (${response.data.size}KB)`);
      fetchBackups();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear backup');
    } finally {
      setCreating(false);
    }
  };

  const deleteBackup = async (filename) => {
    if (!confirm(`¿Eliminar backup ${filename}?`)) return;
    try {
      await api.delete(`/backup-management/${filename}`);
      fetchBackups();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-3"><IconoTitulo e="🗃" />Gestión de Backups</h1>
        <button
          onClick={createBackup}
          disabled={creating}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {creating ? 'Creando...' : '+ Crear Backup'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Información</h2>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="bg-gray-50 p-3 rounded">
            <span className="text-gray-500">Backups totales:</span>
            <span className="font-bold ml-2">{backups.length}</span>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <span className="text-gray-500">Último backup:</span>
            <span className="font-bold ml-2">{backups[0] ? new Date(backups[0].created_at).toLocaleDateString('es-CO') : 'Nunca'}</span>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <span className="text-gray-500">Tamaño total:</span>
            <span className="font-bold ml-2">{backups.reduce((s, b) => s + b.size, 0)} KB</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Archivo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tamaño</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {backups.length > 0 ? backups.map((backup, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-mono">{backup.filename}</td>
                <td className="px-6 py-4 text-sm">{backup.size} KB</td>
                <td className="px-6 py-4 text-sm">{new Date(backup.created_at).toLocaleString('es-CO')}</td>
                <td className="px-6 py-4">
                  <button onClick={() => deleteBackup(backup.filename)} className="text-red-600 text-sm hover:underline">
                    Eliminar
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-gray-400">No hay backups disponibles</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BackupManagement;