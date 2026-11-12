import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Icono, IconoTitulo } from '../components/Icono';

const ContractManagement = () => {
  const [contracts, setContracts] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [filter, setFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newContract, setNewContract] = useState({
    name: '', vendor_id: '', start_date: '', end_date: '', value: '', type: 'service', description: '', renewal_period: 12
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      const url = filter ? `/contract-management?status=${filter}` : '/contract-management';
      const [contractsRes, expiringRes] = await Promise.all([
        api.get(url),
        api.get('/contract-management/expiring?days=30')
      ]);
      setContracts(contractsRes.data);
      setExpiring(expiringRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createContract = async () => {
    try {
      await api.post('/contract-management', newContract);
      setShowCreate(false);
      setNewContract({ name: '', vendor_id: '', start_date: '', end_date: '', value: '', type: 'service', description: '', renewal_period: 12 });
      fetchData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const renewContract = async (id) => {
    if (!confirm('¿Renovar este contrato?')) return;
    try {
      await api.post(`/contract-management/${id}/renew`);
      fetchData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-3"><IconoTitulo e="📄" />Gestión de Contratos</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          + Nuevo Contrato
        </button>
      </div>

      {expiring.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2"><Icono e="⚠️" />Contratos Próximos a Vencer (30 días)</h2>
          <div className="space-y-1">
            {expiring.map(c => (
              <div key={c.id} className="flex justify-between text-sm">
                <span>{c.name} ({c.vendor_name})</span>
                <span className="text-yellow-700">Vence: {c.end_date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showCreate && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Crear Contrato</h2>
          <div className="grid grid-cols-2 gap-4">
            <input type="text" value={newContract.name} onChange={(e) => setNewContract({...newContract, name: e.target.value})} placeholder="Nombre" className="border rounded px-3 py-2" />
            <select value={newContract.type} onChange={(e) => setNewContract({...newContract, type: e.target.value})} className="border rounded px-3 py-2">
              <option value="service">Servicio</option>
              <option value="license">Licencia</option>
              <option value="maintenance">Mantenimiento</option>
              <option value="support">Soporte</option>
            </select>
            <input type="date" value={newContract.start_date} onChange={(e) => setNewContract({...newContract, start_date: e.target.value})} className="border rounded px-3 py-2" />
            <input type="date" value={newContract.end_date} onChange={(e) => setNewContract({...newContract, end_date: e.target.value})} className="border rounded px-3 py-2" />
            <input type="number" value={newContract.value} onChange={(e) => setNewContract({...newContract, value: e.target.value})} placeholder="Valor" className="border rounded px-3 py-2" />
            <input type="number" value={newContract.renewal_period} onChange={(e) => setNewContract({...newContract, renewal_period: parseInt(e.target.value)})} placeholder="Meses renovación" className="border rounded px-3 py-2" />
            <input type="text" value={newContract.description} onChange={(e) => setNewContract({...newContract, description: e.target.value})} placeholder="Descripción" className="border rounded px-3 py-2 col-span-2" />
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={createContract} className="bg-green-500 text-white px-4 py-2 rounded">Crear</button>
            <button onClick={() => setShowCreate(false)} className="bg-gray-300 px-4 py-2 rounded">Cancelar</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border rounded px-3 py-2">
            <option value="">Todos</option>
            <option value="active">Activos</option>
            <option value="expired">Expirados</option>
          </select>
        </div>
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inicio</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fin</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {contracts.map(contract => (
              <tr key={contract.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium">{contract.name}</div>
                  <div className="text-sm text-gray-500">{contract.vendor_name}</div>
                </td>
                <td className="px-6 py-4 text-sm capitalize">{contract.type}</td>
                <td className="px-6 py-4 text-sm">{contract.start_date}</td>
                <td className="px-6 py-4 text-sm">{contract.end_date}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(contract.status)}`}>
                    {contract.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {contract.status === 'active' && (
                    <button onClick={() => renewContract(contract.id)} className="text-blue-600 text-sm hover:underline">
                      Renovar
                    </button>
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

export default ContractManagement;