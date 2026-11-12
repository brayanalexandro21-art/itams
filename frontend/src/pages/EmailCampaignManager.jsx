import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { IconoTitulo } from '../components/Icono';

const EmailCampaignManager = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', subject: '', body: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCampaigns(); }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await api.get('/email-campaign');
      setCampaigns(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async () => {
    try {
      await api.post('/email-campaign', newCampaign);
      setShowCreate(false);
      setNewCampaign({ name: '', subject: '', body: '' });
      fetchCampaigns();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const sendCampaign = async (id) => {
    if (!confirm('¿Enviar esta campaña a todos los usuarios?')) return;
    try {
      const response = await api.post(`/email-campaign/${id}/send`, {});
      alert(`Campaña enviada a ${response.data.sent} usuarios`);
      fetchCampaigns();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const deleteCampaign = async (id) => {
    if (!confirm('¿Eliminar esta campaña?')) return;
    try {
      await api.delete(`/email-campaign/${id}`);
      setSelectedCampaign(null);
      fetchCampaigns();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-3"><IconoTitulo e="📣" />Gestor de Campañas de Email</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          + Nueva Campaña
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Crear Campaña</h2>
          <div className="space-y-4 mb-4">
            <input type="text" value={newCampaign.name} onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})} placeholder="Nombre de la campaña" className="w-full border rounded px-3 py-2" />
            <input type="text" value={newCampaign.subject} onChange={(e) => setNewCampaign({...newCampaign, subject: e.target.value})} placeholder="Asunto del email" className="w-full border rounded px-3 py-2" />
            <textarea value={newCampaign.body} onChange={(e) => setNewCampaign({...newCampaign, body: e.target.value})} placeholder="Cuerpo del mensaje" className="w-full border rounded px-3 py-2 h-32" />
          </div>
          <div className="flex gap-2">
            <button onClick={createCampaign} className="bg-green-500 text-white px-4 py-2 rounded">Crear</button>
            <button onClick={() => setShowCreate(false)} className="bg-gray-300 px-4 py-2 rounded">Cancelar</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Campañas ({campaigns.length})</h2>
          <div className="space-y-2">
            {campaigns.map(c => (
              <div key={c.id} onClick={() => setSelectedCampaign(c)} className={`p-3 rounded-lg cursor-pointer ${selectedCampaign?.id === c.id ? 'bg-blue-100' : 'bg-gray-50 hover:bg-gray-100'}`}>
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-gray-500">{c.sent_count || 0} envíos</div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          {selectedCampaign ? (
            <>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-semibold">{selectedCampaign.name}</h2>
                  <p className="text-sm text-gray-500">Asunto: {selectedCampaign.subject}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => sendCampaign(selectedCampaign.id)} className="bg-green-500 text-white px-3 py-1 rounded text-sm">Enviar ahora</button>
                  <button onClick={() => deleteCampaign(selectedCampaign.id)} className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm">Eliminar</button>
                </div>
              </div>

              <div className="bg-gray-50 rounded p-4 mb-4">
                <h3 className="font-medium text-sm mb-2">Vista previa del mensaje:</h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedCampaign.body}</p>
              </div>

              <div className="text-sm text-gray-500">
                Enviado {selectedCampaign.sent_count || 0} veces
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 py-12">Selecciona una campaña</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailCampaignManager;