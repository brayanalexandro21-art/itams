import React, { useState, useEffect } from 'react';
import api from '../services/api';

const ReportScheduler = () => {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newReport, setNewReport] = useState({
    name: '', description: '', type: 'ticket_summary', schedule: 'weekly', recipients: []
  });
  const [loading, setLoading] = useState(true);
  const [runResult, setRunResult] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await api.get('/report-scheduler');
      setReports(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createReport = async () => {
    try {
      await api.post('/report-scheduler', newReport);
      setShowCreate(false);
      setNewReport({ name: '', description: '', type: 'ticket_summary', schedule: 'weekly', recipients: [] });
      fetchReports();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const runReport = async (id) => {
    try {
      const response = await api.post(`/report-scheduler/${id}/run`);
      setRunResult(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const deleteReport = async (id) => {
    if (!confirm('¿Eliminar reporte?')) return;
    try {
      await api.delete(`/report-scheduler/${id}`);
      setSelectedReport(null);
      fetchReports();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'ticket_summary': return '🎫';
      case 'asset_inventory': return '💻';
      case 'sla_compliance': return '⏱️';
      case 'technician_performance': return '👨‍💼';
      default: return '📊';
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">📊 Programador de Reportes</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          + Nuevo Reporte
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Crear Reporte Programado</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input type="text" value={newReport.name} onChange={(e) => setNewReport({...newReport, name: e.target.value})} placeholder="Nombre" className="border rounded px-3 py-2" />
            <select value={newReport.type} onChange={(e) => setNewReport({...newReport, type: e.target.value})} className="border rounded px-3 py-2">
              <option value="ticket_summary">Resumen de Tickets</option>
              <option value="asset_inventory">Inventario de Activos</option>
              <option value="sla_compliance">Cumplimiento SLA</option>
              <option value="technician_performance">Rendimiento de Técnicos</option>
            </select>
            <select value={newReport.schedule} onChange={(e) => setNewReport({...newReport, schedule: e.target.value})} className="border rounded px-3 py-2">
              <option value="daily">Diario</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
            </select>
            <input type="text" value={newReport.description} onChange={(e) => setNewReport({...newReport, description: e.target.value})} placeholder="Descripción" className="border rounded px-3 py-2" />
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
              <div
                key={r.id}
                onClick={() => { setSelectedReport(r); setRunResult(null); }}
                className={`p-3 rounded-lg cursor-pointer ${selectedReport?.id === r.id ? 'bg-blue-100' : 'bg-gray-50 hover:bg-gray-100'}`}
              >
                <div className="font-medium flex items-center gap-2">
                  <span>{getTypeIcon(r.type)}</span> {r.name}
                </div>
                <div className="text-xs text-gray-500 capitalize">{r.type?.replace(/_/g, ' ')}</div>
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
                  <button onClick={() => runReport(selectedReport.id)} className="bg-green-500 text-white px-3 py-1 rounded text-sm">Ejecutar ahora</button>
                  <button onClick={() => deleteReport(selectedReport.id)} className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm">Eliminar</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div><span className="text-gray-500">Tipo:</span> <span className="capitalize">{selectedReport.type?.replace(/_/g, ' ')}</span></div>
                <div><span className="text-gray-500">Frecuencia:</span> <span className="capitalize">{selectedReport.schedule}</span></div>
              </div>

              {runResult && (
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-medium mb-2">Resultado de Ejecución</h3>
                  <div className="bg-gray-50 rounded p-4">
                    <div className="text-sm text-gray-500 mb-2">Generado: {new Date(runResult.generated_at).toLocaleString()}</div>
                    <pre className="text-sm bg-white p-3 rounded border overflow-auto max-h-60">
                      {JSON.stringify(runResult.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 py-12">Selecciona un reporte</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportScheduler;