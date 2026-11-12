import React, { useState, useEffect } from 'react';
import api from '../services/api';

const TechnicianPerformance = () => {
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get('/advanced-reporting/technician-performance');
      setPerformance(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">👨‍💼 Rendimiento de Técnicos</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Técnico</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asignados</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resueltos</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tasa Resolución</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tiempo Promedio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {performance.map((tech, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium">{tech.name}</div>
                  <div className="text-sm text-gray-500">{tech.email}</div>
                </td>
                <td className="px-6 py-4">{tech.tickets_assigned}</td>
                <td className="px-6 py-4">{tech.tickets_resolved}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-sm ${
                    tech.resolution_rate >= 80 ? 'bg-green-100 text-green-800' :
                    tech.resolution_rate >= 50 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {tech.resolution_rate || 0}%
                  </span>
                </td>
                <td className="px-6 py-4">
                  {tech.avg_resolution_days ? `${Math.round(tech.avg_resolution_days * 10) / 10} días` : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TechnicianPerformance;