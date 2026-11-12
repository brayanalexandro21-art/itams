import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Icono, IconoTitulo } from '../components/Icono';

const DashboardWidgetBuilder = () => {
  const [widgets, setWidgets] = useState([]);
  const [widgetTypes, setWidgetTypes] = useState([]);
  const [widgetData, setWidgetData] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [newWidget, setNewWidget] = useState({ title: '', widget_type: 'ticket_stats', width: 1, height: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [widgetsRes, typesRes] = await Promise.all([
        api.get('/dashboard-widget-builder'),
        api.get('/dashboard-widget-builder/types')
      ]);
      setWidgets(widgetsRes.data);
      setWidgetTypes(typesRes.data);

      // Fetch data for each widget
      for (const w of widgetsRes.data) {
        try {
          const dataRes = await api.get(`/dashboard-widget-builder/${w.id}/data`);
          setWidgetData(prev => ({ ...prev, [w.id]: dataRes.data }));
        } catch (e) {}
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addWidget = async () => {
    try {
      await api.post('/dashboard-widget-builder', newWidget);
      setShowAdd(false);
      setNewWidget({ title: '', widget_type: 'ticket_stats', width: 1, height: 1 });
      fetchData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const deleteWidget = async (id) => {
    if (!confirm('¿Eliminar widget?')) return;
    try {
      await api.delete(`/dashboard-widget-builder/${id}`);
      fetchData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const renderWidgetContent = (widget) => {
    const data = widgetData[widget.id]?.data;
    if (!data) return <div className="text-gray-400 text-sm">Cargando...</div>;

    switch (widget.widget_type) {
      case 'ticket_stats':
        return (
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center"><p className="text-2xl font-bold text-yellow-600">{data.open || 0}</p><p className="text-xs text-gray-500">Abiertos</p></div>
            <div className="text-center"><p className="text-2xl font-bold text-blue-600">{data.in_progress || 0}</p><p className="text-xs text-gray-500">En Progreso</p></div>
            <div className="text-center"><p className="text-2xl font-bold text-green-600">{data.resolved || 0}</p><p className="text-xs text-gray-500">Resueltos</p></div>
            <div className="text-center"><p className="text-2xl font-bold">{data.total || 0}</p><p className="text-xs text-gray-500">Total</p></div>
          </div>
        );
      case 'asset_stats':
        return (
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center"><p className="text-xl font-bold">{data.total || 0}</p><p className="text-xs text-gray-500">Total</p></div>
            <div className="text-center"><p className="text-xl font-bold text-green-600">{data.available || 0}</p><p className="text-xs text-gray-500">Disponibles</p></div>
            <div className="text-center"><p className="text-xl font-bold text-blue-600">{data.in_use || 0}</p><p className="text-xs text-gray-500">En uso</p></div>
          </div>
        );
      case 'recent_tickets':
        return (
          <div className="space-y-1">
            {data.map((t, i) => (
              <div key={i} className="flex justify-between text-sm p-1">
                <span className="truncate flex-1">#{t.id} {t.title}</span>
                <span className={`text-xs px-1 rounded ${t.status === 'open' ? 'bg-yellow-100' : 'bg-green-100'}`}>{t.status}</span>
              </div>
            ))}
          </div>
        );
      case 'user_stats':
        return <div className="text-center"><p className="text-3xl font-bold">{data.total || 0}</p><p className="text-sm text-gray-500">Usuarios</p></div>;
      default:
        return <div className="text-gray-400 text-sm">Sin datos</div>;
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-3"><IconoTitulo e="🎨" />Constructor de Dashboard</h1>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          + Agregar Widget
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Nuevo Widget</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <input type="text" value={newWidget.title} onChange={(e) => setNewWidget({...newWidget, title: e.target.value})} placeholder="Título" className="border rounded px-3 py-2" />
            <select value={newWidget.widget_type} onChange={(e) => setNewWidget({...newWidget, widget_type: e.target.value})} className="border rounded px-3 py-2">
              {widgetTypes.map(t => <option key={t.type} value={t.type}>{t.name}</option>)}
            </select>
            <div className="flex gap-2">
              <button onClick={addWidget} className="bg-green-500 text-white px-4 py-2 rounded">Agregar</button>
              <button onClick={() => setShowAdd(false)} className="bg-gray-300 px-4 py-2 rounded">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {widgets.map(w => {
          const typeInfo = widgetTypes.find(t => t.type === w.widget_type);
          return (
            <div key={w.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <span><Icono e={typeInfo?.icon} className="h-5 w-5" /></span> {w.title}
                </h3>
                <button onClick={() => deleteWidget(w.id)} className="text-red-500 text-xs hover:underline">Eliminar</button>
              </div>
              {renderWidgetContent(w)}
            </div>
          );
        })}
        {widgets.length === 0 && (
          <div className="col-span-3 text-center text-gray-400 py-12 bg-white rounded-lg shadow">
            No hay widgets. Agrega uno para empezar.
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardWidgetBuilder;