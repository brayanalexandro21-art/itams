import React, { useState, useEffect } from 'react';
import api from '../services/api';

const DashboardLayoutManager = () => {
  const [layouts, setLayouts] = useState([]);
  const [selectedLayout, setSelectedLayout] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newLayout, setNewLayout] = useState({ name: '', is_default: false, layout_config: { columns: 2, widgets: [] } });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchLayouts(); }, []);

  const fetchLayouts = async () => {
    try {
      const response = await api.get('/dashboard-layout-manager');
      setLayouts(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createLayout = async () => {
    try {
      await api.post('/dashboard-layout-manager', newLayout);
      setShowCreate(false);
      setNewLayout({ name: '', is_default: false, layout_config: { columns: 2, widgets: [] } });
      fetchLayouts();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const setDefault = async (id) => {
    try {
      await api.post(`/dashboard-layout-manager/${id}/default`);
      fetchLayouts();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const deleteLayout = async (id) => {
    if (!confirm('¿Eliminar este layout?')) return;
    try {
      await api.delete(`/dashboard-layout-manager/${id}`);
      setSelectedLayout(null);
      fetchLayouts();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">📐 Gestor de Layouts del Dashboard</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          + Nuevo Layout
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Crear Layout</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input type="text" value={newLayout.name} onChange={(e) => setNewLayout({...newLayout, name: e.target.value})} placeholder="Nombre" className="border rounded px-3 py-2" />
            <select value={newLayout.layout_config.columns} onChange={(e) => setNewLayout({...newLayout, layout_config: {...newLayout.layout_config, columns: parseInt(e.target.value)}})} className="border rounded px-3 py-2">
              <option value={1}>1 columna</option>
              <option value={2}>2 columnas</option>
              <option value={3}>3 columnas</option>
            </select>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={newLayout.is_default} onChange={(e) => setNewLayout({...newLayout, is_default: e.target.checked})} />
              <span className="text-sm">Predeterminado</span>
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={createLayout} className="bg-green-500 text-white px-4 py-2 rounded">Crear</button>
            <button onClick={() => setShowCreate(false)} className="bg-gray-300 px-4 py-2 rounded">Cancelar</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {layouts.map(l => (
          <div key={l.id} className={`bg-white rounded-lg shadow p-6 cursor-pointer border-2 ${selectedLayout?.id === l.id ? 'border-blue-500' : 'border-transparent'}`} onClick={() => setSelectedLayout(l)}>
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold">{l.name}</h3>
              {l.is_default ? <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Predeterminado</span> : null}
            </div>
            <div className="text-sm text-gray-500 mb-4">
              {l.layout_config ? JSON.parse(l.layout_config || '{}').columns || 2 : 2} columnas
            </div>
            <div className="flex gap-2">
              {!l.is_default && <button onClick={(e) => { e.stopPropagation(); setDefault(l.id); }} className="text-blue-600 text-xs hover:underline">Hacer default</button>}
              <button onClick={(e) => { e.stopPropagation(); deleteLayout(l.id); }} className="text-red-500 text-xs hover:underline">Eliminar</button>
            </div>
          </div>
        ))}
        {layouts.length === 0 && <div className="col-span-3 text-center text-gray-400 py-12 bg-white rounded-lg shadow">No hay layouts creados</div>}
      </div>
    </div>
  );
};

export default DashboardLayoutManager;