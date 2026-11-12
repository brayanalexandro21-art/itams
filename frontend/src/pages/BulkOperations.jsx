import React, { useState, useEffect } from 'react';
import api from '../services/api';

const BulkOperations = () => {
  const [tickets, setTickets] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkValue, setBulkValue] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await api.get('/tickets');
      setTickets(response.data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(tickets.map(t => t.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const executeBulkAction = async () => {
    if (selectedIds.length === 0 || !bulkAction) return;

    setLoading(true);
    try {
      let endpoint = '';
      let payload = { ticket_ids: selectedIds };

      switch (bulkAction) {
        case 'status':
          endpoint = '/bulk/tickets/status';
          payload.status = bulkValue;
          break;
        case 'assign':
          endpoint = '/bulk/tickets/assign';
          payload.assigned_to = bulkValue;
          break;
        case 'delete':
          endpoint = '/bulk/tickets/delete';
          break;
      }

      await api.post(endpoint, payload);
      alert(`Operación completada: ${selectedIds.length} tickets procesados`);
      setSelectedIds([]);
      setBulkAction('');
      fetchTickets();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al ejecutar la operación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Operaciones Masivas</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Seleccionar Acción</h2>
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Acción</label>
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="border rounded px-4 py-2"
            >
              <option value="">Seleccionar...</option>
              <option value="status">Cambiar Estado</option>
              <option value="assign">Asignar</option>
              <option value="delete">Eliminar</option>
            </select>
          </div>

          {bulkAction === 'status' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nuevo Estado</label>
              <select
                value={bulkValue}
                onChange={(e) => setBulkValue(e.target.value)}
                className="border rounded px-4 py-2"
              >
                <option value="open">Abierto</option>
                <option value="in_progress">En Progreso</option>
                <option value="resolved">Resuelto</option>
                <option value="closed">Cerrado</option>
              </select>
            </div>
          )}

          {bulkAction === 'assign' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asignar a</label>
              <input
                type="text"
                value={bulkValue}
                onChange={(e) => setBulkValue(e.target.value)}
                placeholder="ID del técnico"
                className="border rounded px-4 py-2"
              />
            </div>
          )}

          <button
            onClick={executeBulkAction}
            disabled={selectedIds.length === 0 || !bulkAction || loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Procesando...' : `Ejecutar (${selectedIds.length} seleccionados)`}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  className="rounded"
                />
              </th>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Título</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-left">Prioridad</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map(ticket => (
              <tr key={ticket.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(ticket.id)}
                    onChange={() => handleSelect(ticket.id)}
                    className="rounded"
                  />
                </td>
                <td className="px-4 py-3">{ticket.id}</td>
                <td className="px-4 py-3">{ticket.title}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    ticket.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                    ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {ticket.status}
                  </span>
                </td>
                <td className="px-4 py-3">{ticket.priority}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BulkOperations;