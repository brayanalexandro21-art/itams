import React, { useState, useEffect } from 'react';
import api from '../services/api';

const AdvancedReports = () => {
  const [reportType, setReportType] = useState('technician-performance');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/reports/advanced/${reportType}`);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = async () => {
    try {
      const response = await api.get(`/export/csv/${reportType === 'technician-performance' ? 'tickets' : reportType}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}_report.csv`);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error('Error exporting:', error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Reportes Avanzados</h1>
      
      <div className="flex gap-4 mb-6">
        <select 
          value={reportType} 
          onChange={(e) => setReportType(e.target.value)}
          className="border rounded px-4 py-2"
        >
          <option value="technician-performance">Rendimiento de Técnicos</option>
          <option value="satisfaction">Satisfacción del Cliente</option>
          <option value="asset-usage">Uso de Activos</option>
          <option value="sla-compliance">Cumplimiento SLA</option>
        </select>
        
        <button 
          onClick={exportToCSV}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Exportar CSV
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : data ? (
        <div className="bg-white rounded-lg shadow p-6">
          <pre className="overflow-auto">{JSON.stringify(data, null, 2)}</pre>
        </div>
      ) : null}
    </div>
  );
};

export default AdvancedReports;
