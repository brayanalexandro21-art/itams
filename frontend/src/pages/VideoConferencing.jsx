import React, { useState, useEffect } from 'react';
import api from '../services/api';

const VideoConferencing = () => {
  const [integrations, setIntegrations] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    platform: 'zoom',
    scheduled_time: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [intRes, meetRes] = await Promise.all([
        api.get('/video-conferencing/list'),
        api.get('/video-conferencing/meetings'),
      ]);
      setIntegrations(intRes.data);
      setMeetings(meetRes.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const createMeeting = async () => {
    try {
      await api.post('/video-conferencing/create-meeting', formData);
      alert('Reunión creada exitosamente');
      setShowCreate(false);
      fetchData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">📹 Video Conferencia</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Integraciones disponibles */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Plataformas</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📹</span>
                <span>Zoom</span>
              </div>
              <span className="text-green-600 text-sm">Disponible</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎥</span>
                <span>Google Meet</span>
              </div>
              <span className="text-green-600 text-sm">Disponible</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💼</span>
                <span>Microsoft Teams</span>
              </div>
              <span className="text-gray-400 text-sm">Próximamente</span>
            </div>
          </div>
        </div>

        {/* Próximas reuniones */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Próximas Reuniones</h2>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
            >
              + Nueva
            </button>
          </div>
          
          {meetings.length > 0 ? (
            <div className="space-y-3">
              {meetings.map((meeting, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium">{meeting.title}</div>
                  <div className="text-sm text-gray-500">{meeting.scheduled_time}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No hay reuniones programadas</p>
          )}
        </div>
      </div>

      {/* Modal crear reunión */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Crear Reunión</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Título"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full border rounded px-3 py-2"
              />
              <textarea
                placeholder="Descripción"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full border rounded px-3 py-2"
                rows={3}
              />
              <input
                type="datetime-local"
                value={formData.scheduled_time}
                onChange={(e) => setFormData({...formData, scheduled_time: e.target.value})}
                className="w-full border rounded px-3 py-2"
              />
              <div className="flex gap-3 mt-4">
                <button onClick={() => setShowCreate(false)} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded">
                  Cancelar
                </button>
                <button onClick={createMeeting} className="flex-1 bg-blue-500 text-white py-2 rounded">
                  Crear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoConferencing;