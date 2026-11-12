import React, { useState, useEffect } from 'react';
import api from '../services/api';

const PurchaseOrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('');
  const [newOrder, setNewOrder] = useState({
    vendor_id: '', description: '', expected_date: '',
    items: [{ description: '', quantity: 1, unit_price: 0 }]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      const url = filter ? `/purchase-order-management?status=${filter}` : '/purchase-order-management';
      const [ordersRes, vendorsRes] = await Promise.all([
        api.get(url),
        api.get('/vendor-management')
      ]);
      setOrders(ordersRes.data);
      setVendors(vendorsRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrder = async (id) => {
    try {
      const response = await api.get(`/purchase-order-management/${id}`);
      setSelectedOrder(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const createOrder = async () => {
    try {
      await api.post('/purchase-order-management', newOrder);
      setShowCreate(false);
      setNewOrder({ vendor_id: '', description: '', expected_date: '', items: [{ description: '', quantity: 1, unit_price: 0 }] });
      fetchData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/purchase-order-management/${id}/status`, { status });
      fetchOrder(id);
      fetchData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const cancelOrder = async (id) => {
    if (!confirm('¿Cancelar esta orden?')) return;
    try {
      await api.post(`/purchase-order-management/${id}/cancel`);
      fetchOrder(id);
      fetchData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const addItem = () => {
    setNewOrder({...newOrder, items: [...newOrder.items, { description: '', quantity: 1, unit_price: 0 }]});
  };

  const updateItem = (index, field, value) => {
    const items = [...newOrder.items];
    items[index] = {...items[index], [field]: value};
    setNewOrder({...newOrder, items});
  };

  const removeItem = (index) => {
    setNewOrder({...newOrder, items: newOrder.items.filter((_, i) => i !== index)});
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'received': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🛒 Órdenes de Compra</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          + Nueva Orden
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Crear Orden de Compra</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <select value={newOrder.vendor_id} onChange={(e) => setNewOrder({...newOrder, vendor_id: e.target.value})} className="border rounded px-3 py-2">
              <option value="">Seleccionar proveedor</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
            <input type="text" value={newOrder.description} onChange={(e) => setNewOrder({...newOrder, description: e.target.value})} placeholder="Descripción" className="border rounded px-3 py-2" />
            <input type="date" value={newOrder.expected_date} onChange={(e) => setNewOrder({...newOrder, expected_date: e.target.value})} className="border rounded px-3 py-2" />
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Items</h3>
              <button onClick={addItem} className="text-blue-600 text-sm">+ Agregar item</button>
            </div>
            {newOrder.items.map((item, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input type="text" value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} placeholder="Descripción" className="flex-1 border rounded px-3 py-1 text-sm" />
                <input type="number" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value))} placeholder="Cant." className="w-20 border rounded px-3 py-1 text-sm" />
                <input type="number" value={item.unit_price} onChange={(e) => updateItem(i, 'unit_price', parseFloat(e.target.value))} placeholder="Precio" className="w-24 border rounded px-3 py-1 text-sm" />
                {newOrder.items.length > 1 && <button onClick={() => removeItem(i)} className="text-red-500 text-sm">X</button>}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={createOrder} className="bg-green-500 text-white px-4 py-2 rounded">Crear</button>
            <button onClick={() => setShowCreate(false)} className="bg-gray-300 px-4 py-2 rounded">Cancelar</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full border rounded px-3 py-2">
              <option value="">Todas</option>
              <option value="pending">Pendientes</option>
              <option value="approved">Aprobadas</option>
              <option value="received">Recibidas</option>
              <option value="cancelled">Canceladas</option>
            </select>
          </div>
          <div className="space-y-2">
            {orders.map(order => (
              <div
                key={order.id}
                onClick={() => fetchOrder(order.id)}
                className={`p-3 rounded-lg cursor-pointer ${selectedOrder?.id === order.id ? 'bg-blue-100' : 'bg-gray-50 hover:bg-gray-100'}`}
              >
                <div className="font-medium text-sm">{order.order_number}</div>
                <div className="text-xs text-gray-500">{order.vendor_name}</div>
                <div className="text-xs font-medium">${order.total?.toFixed(2) || 0}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          {selectedOrder ? (
            <>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-semibold">{selectedOrder.order_number}</h2>
                  <p className="text-gray-500">{selectedOrder.vendor_name}</p>
                </div>
                <span className={`px-3 py-1 rounded text-sm ${getStatusBadge(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div><span className="text-gray-500">Fecha esperada:</span> {selectedOrder.expected_date}</div>
                <div><span className="text-gray-500">Descripción:</span> {selectedOrder.description}</div>
              </div>

              {selectedOrder.items?.length > 0 && (
                <div className="border-t pt-4 mb-4">
                  <h3 className="font-medium mb-2">Items</h3>
                  <table className="min-w-full text-sm">
                    <thead><tr className="border-b"><th className="text-left py-1">Descripción</th><th className="text-right py-1">Cant.</th><th className="text-right py-1">Precio</th><th className="text-right py-1">Total</th></tr></thead>
                    <tbody>
                      {selectedOrder.items.map((item, i) => (
                        <tr key={i} className="border-b">
                          <td className="py-1">{item.description}</td>
                          <td className="text-right py-1">{item.quantity}</td>
                          <td className="text-right py-1">${item.unit_price}</td>
                          <td className="text-right py-1">${(item.quantity * item.unit_price).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="border-t pt-4 flex gap-2">
                {selectedOrder.status === 'pending' && (
                  <button onClick={() => updateStatus(selectedOrder.id, 'approved')} className="bg-green-500 text-white px-3 py-1 rounded text-sm">Aprobar</button>
                )}
                {selectedOrder.status === 'approved' && (
                  <button onClick={() => updateStatus(selectedOrder.id, 'received')} className="bg-blue-500 text-white px-3 py-1 rounded text-sm">Marcar Recibida</button>
                )}
                {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'received' && (
                  <button onClick={() => cancelOrder(selectedOrder.id)} className="bg-red-500 text-white px-3 py-1 rounded text-sm">Cancelar</button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 py-12">Selecciona una orden</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderManagement;