import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { IconoTitulo } from '../components/Icono';

const CustomReportBuilder = () => {
  const [reports, setReports] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [result, setResult] = useState(null);
  const [newReport, setNewReport] = useState({
    name: '', description: '', config: { entity: 'tickets', fields: ['id', 'title', 'status', 'priority'], filters: {}, sort: { field: 'created_at', order: 'DESC' }, limit: 50 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [reportsRes, templatesRes] = await Promise.all([
        api.get('/custom-report-builder'),
        api.get('/custom-report-builder/templates')
      ]);
      setReports(reportsRes.data);
      setTemplates(templatesRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createReport = async () => {
    try {
      await api.post('/custom-report-builder', newReport);
      setShowCreate(false);
      fetchData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const runReport = async (id) => {
    try {
      const response = await api.post(`/custom-report-builder/${id}/run`);
      setResult(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const deleteReport = async (id) => {
    if (!confirm('¿Eliminar reporte?')) return;
    try {
      await api.delete(`/custom-report-builder/${id}`);
      setSelectedReport(null);
      setResult(null);
      fetchData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadTemplate = (tmpl) => {
    setNewReport({ ...newReport, config: { ...tmpl, filters: tmpl.filters || {}, sort: tmpl.sort || { field: 'created_at', order: 'DESC' } } });
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-3"><IconoTitulo e="📊" />Constructor de Reportes</h1>
        <button onClick={() => { setShowCreate(!showCreate); setResult(null); }} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          + Nuevo Reporte
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Crear Reporte Personalizado</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input type="text" value={newReport.name} onChange={(e) => setNewReport({...newReport, name: e.target.value})} placeholder="Nombre del reporte" className="border rounded px-3 py-2" />
            <select value={newReport.config.entity} onChange={(e) => setNewReport({...newReport, config: {...newReport.config, entity: e.target.value}})} className="border rounded px-3 py-2">
              <option value="tickets">Tickets</option>
              <option value="assets">Activos</option>
              <option value="users">Usuarios</option>
              <option value="summary">Resumen General</option>
            </select>
          </div>

          <div className="mb-4">
            <h3 className="font-medium text-sm mb-2">Plantillas rápidas</h3>
            <div className="flex flex-wrap gap-2">
              {templates.map((t, i) => (
                <button key={i} onClick={() => loadTemplate(t)} className="px-3 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200">{t.name}</button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Campos</label>
            <input type="text" value={newReport.config.fields?.join(', ')} onChange={(e) => setNewReport({...newReport, config: {...newReport.config, fields: e.target.value.split(',').map(f => f.trim())}})} className="w-full border rounded px-3 py-2 text-sm" placeholder="id, title, status, priority" />
          </div>

          <div className="flex gap-2">
            <button onClick={createReport} className="bg-green-500 text-white px-4 py-2 rounded">Crear</button>
            <button onClick={() => setShowCreate(false)} className="bg-gray-300 px-4 py-2 rounded">Cancelar</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Reportes ({reports.length})</h2>
          <div className="space-y-2">
            {reports.map(r => (
              <div key={r.id} onClick={() => { setSelectedReport(r); setResult(null); }} className={`p-3 rounded-lg cursor-pointer ${selectedReport?.id === r.id ? 'bg-blue-100' : 'bg-gray-50 hover:bg-gray-100'}`}>
                <div className="font-medium text-sm">{r.name}</div>
                <div className="text-xs text-gray-400 capitalize">{JSON.parse(r.config || '{}').entity}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          {selectedReport ? (
            <>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-semibold">{selectedReport.name}</h2>
                  <p className="text-sm text-gray-500">{selectedReport.description}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => runReport(selectedReport.id)} className="bg-green-500 text-white px-3 py-1 rounded text-sm">Ejecutar</button>
                  <button onClick={() => deleteReport(selectedReport.id)} className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm">Eliminar</button>
                </div>
              </div>

              {result && (
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">Resultado ({result.count} registros)</h3>
                  {Array.isArray(result.data) ? (
                    <div className="overflow-x-auto max-h-80">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            {result.data[0] && Object.keys(result.data[0]).map(k => (
                              <th key={k} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{k}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {result.data.slice(0, 50).map((row, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                              {Object.values(row).map((v, j) => (
                                <td key={j} className="px-3 py-2 text-sm">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto">{JSON.stringify(result.data, null, 2)}</pre>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 py-12">Selecciona un reporte o crea uno nuevo</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomReportBuilder;