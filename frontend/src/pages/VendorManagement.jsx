import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { IconoTitulo } from '../components/Icono';

const VendorManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('');
  const [newVendor, setNewVendor] = useState({
    name: '', email: '', phone: '', address: '', category: 'hardware', website: '', notes: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVendors();
  }, [filter]);

  const fetchVendors = async () => {
    try {
      const url = filter ? `/vendor-management?category=${filter}` : '/vendor-management';
      const response = await api.get(url);
      setVendors(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendor = async (id) => {
    try {
      const response = await api.get(`/vendor-management/${id}`);
      setSelectedVendor(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const createVendor = async () => {
    try {
      await api.post('/vendor-management', newVendor);
      setNewVendor({ name: '', email: '', phone: '', address: '', category: 'hardware', website: '', notes: '' });
      setShowCreate(false);
      fetchVendors();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const deleteVendor = async (id) => {
    if (!confirm('¿Eliminar este proveedor?')) return;
    try {
      await api.delete(`/vendor-management/${id}`);
      setSelectedVendor(null);
      fetchVendors();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-3"><IconoTitulo e="🏢" />Gestión de Proveedores</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          + Nuevo Proveedor
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Crear Proveedor</h2>
          <div className="grid grid-cols-2 gap-4">
            <input type="text" value={newVendor.name} onChange={(e) => setNewVendor({...newVendor, name: e.target.value})} placeholder="Nombre" className="border rounded px-3 py-2" />
            <input type="email" value={newVendor.email} onChange={(e) => setNewVendor({...newVendor, email: e.target.value})} placeholder="Email" className="border rounded px-3 py-2" />
            <input type="text" value={newVendor.phone} onChange={(e) => setNewVendor({...newVendor, phone: e.target.value})} placeholder="Teléfono" className="border rounded px-3 py-2" />
            <select value={newVendor.category} onChange={(e) => setNewVendor({...newVendor, category: e.target.value})} className="border rounded px-3 py-2">
              <option value="hardware">Hardware</option>
              <option value="software">Software</option>
              <option value="services">Servicios</option>
              <option value="network">Red</option>
            </select>
            <input type="text" value={newVendor.address} onChange={(e) => setNewVendor({...newVendor, address: e.target.value})} placeholder="Dirección" className="border rounded px-3 py-2 col-span-2" />
            <input type="text" value={newVendor.website} onChange={(e) => setNewVendor({...newVendor, website: e.target.value})} placeholder="Sitio web" className="border rounded px-3 py-2" />
            <input type="text" value={newVendor.notes} onChange={(e) => setNewVendor({...newVendor, notes: e.target.value})} placeholder="Notas" className="border rounded px-3 py-2" />
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={createVendor} className="bg-green-500 text-white px-4 py-2 rounded">Crear</button>
            <button onClick={() => setShowCreate(false)} className="bg-gray-300 px-4 py-2 rounded">Cancelar</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full border rounded px-3 py-2">
              <option value="">Todas las categorías</option>
              <option value="hardware">Hardware</option>
              <option value="software">Software</option>
              <option value="services">Servicios</option>
              <option value="network">Red</option>
            </select>
          </div>
          <div className="space-y-2">
            {vendors.map(vendor => (
              <div
                key={vendor.id}
                onClick={() => fetchVendor(vendor.id)}
                className={`p-3 rounded-lg cursor-pointer ${selectedVendor?.id === vendor.id ? 'bg-blue-100' : 'bg-gray-50 hover:bg-gray-100'}`}
              >
                <div className="font-medium">{vendor.name}</div>
                <div className="text-sm text-gray-500 capitalize">{vendor.category}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          {selectedVendor ? (
            <>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-semibold">{selectedVendor.name}</h2>
                  <p className="text-gray-500">{selectedVendor.email}</p>
                </div>
                <button onClick={() => deleteVendor(selectedVendor.id)} className="bg-red-500 text-white px-3 py-1 rounded text-sm">Eliminar</button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><span className="text-gray-500">Teléfono:</span> {selectedVendor.phone}</div>
                <div><span className="text-gray-500">Categoría:</span> <span className="capitalize">{selectedVendor.category}</span></div>
                <div><span className="text-gray-500">Dirección:</span> {selectedVendor.address}</div>
                <div><span className="text-gray-500">Sitio web:</span> {selectedVendor.website}</div>
              </div>

              {selectedVendor.ratings && (
                <div className="border-t pt-4 mb-4">
                  <h3 className="font-medium mb-2">Calificaciones Promedio</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <div className="text-lg font-bold">{selectedVendor.ratings.avg_quality?.toFixed(1) || 'N/A'}</div>
                      <div className="text-xs text-gray-500">Calidad</div>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded">
                      <div className="text-lg font-bold">{selectedVendor.ratings.avg_delivery?.toFixed(1) || 'N/A'}</div>
                      <div className="text-xs text-gray-500">Entrega</div>
                    </div>
                    <div className="text-center p-2 bg-yellow-50 rounded">
                      <div className="text-lg font-bold">{selectedVendor.ratings.avg_price?.toFixed(1) || 'N/A'}</div>
                      <div className="text-xs text-gray-500">Precio</div>
                    </div>
                  </div>
                </div>
              )}

              {selectedVendor.contracts?.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">Contratos ({selectedVendor.contracts.length})</h3>
                  <div className="space-y-2">
                    {selectedVendor.contracts.map(c => (
                      <div key={c.id} className="p-2 bg-gray-50 rounded text-sm">
                        {c.name} — {c.start_date} a {c.end_date}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 py-12">Selecciona un proveedor</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorManagement;