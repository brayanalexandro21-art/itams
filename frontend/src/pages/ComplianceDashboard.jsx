import React, { useState, useEffect } from 'react';
import api from '../services/api';

const ComplianceDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState({ category: '', status: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dashRes, itemsRes] = await Promise.all([
        api.get('/compliance-management/dashboard'),
        api.get('/compliance-management/checklist')
      ]);
      setDashboard(dashRes.data);
      setItems(itemsRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/compliance-management/${id}`, { status, notes: '' });
      fetchData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const filteredItems = items.filter(item => {
    if (filter.category && item.category !== filter.category) return false;
    if (filter.status && item.status !== filter.status) return false;
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800';
      case 'non_compliant': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">📋 Dashboard de Compliance</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <h3 className="text-sm text-gray-500">Score General</h3>
          <p className={`text-3xl font-bold ${dashboard?.score >= 80 ? 'text-green-600' : dashboard?.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
            {dashboard?.score || 0}%
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <h3 className="text-sm text-gray-500">Total</h3>
          <p className="text-3xl font-bold">{dashboard?.total || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <h3 className="text-sm text-gray-500">Cumplidos</h3>
          <p className="text-3xl font-bold text-green-600">{dashboard?.compliant || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <h3 className="text-sm text-gray-500">Pendientes</h3>
          <p className="text-3xl font-bold text-yellow-600">{dashboard?.pending || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Por Categoría</h2>
          <div className="space-y-3">
            {dashboard?.byCategory?.map((cat, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="capitalize">{cat.category}</span>
                  <span>{cat.total > 0 ? Math.round((cat.compliant / cat.total) * 100) : 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full"
                    style={{ width: `${cat.total > 0 ? (cat.compliant / cat.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Próximos Vencimientos</h2>
          <div className="space-y-2">
            {dashboard?.upcoming?.map((item, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded">
                <div className="font-medium">{item.title}</div>
                <div className="text-sm text-gray-500">Vence: {item.due_date}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Checklist de Compliance</h2>
          <div className="flex gap-2">
            <select value={filter.category} onChange={(e) => setFilter({...filter, category: e.target.value})} className="border rounded px-3 py-1 text-sm">
              <option value="">Todas</option>
              <option value="security">Seguridad</option>
              <option value="privacy">Privacidad</option>
              <option value="audit">Auditoría</option>
              <option value="regulatory">Regulatorio</option>
            </select>
            <select value={filter.status} onChange={(e) => setFilter({...filter, status: e.target.value})} className="border rounded px-3 py-1 text-sm">
              <option value="">Todos</option>
              <option value="compliant">Cumplido</option>
              <option value="non_compliant">No cumple</option>
              <option value="pending">Pendiente</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          {filteredItems.map(item => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex-1">
                <span className="font-medium">{item.title}</span>
                <span className="text-sm text-gray-500 ml-2 capitalize">{item.category}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs ${getStatusColor(item.status)}`}>
                  {item.status}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => updateStatus(item.id, 'compliant')} className="text-green-600 text-xs px-2 py-1 rounded bg-green-50">✓</button>
                  <button onClick={() => updateStatus(item.id, 'non_compliant')} className="text-red-600 text-xs px-2 py-1 rounded bg-red-50">✗</button>
                  <button onClick={() => updateStatus(item.id, 'pending')} className="text-yellow-600 text-xs px-2 py-1 rounded bg-yellow-50">?</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ComplianceDashboard;