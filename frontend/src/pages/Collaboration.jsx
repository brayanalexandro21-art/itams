import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { IconoTitulo } from '../components/Icono';

const Collaboration = () => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await api.get('/collaboration/chat/rooms');
      setRooms(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchMessages = async (roomId) => {
    setLoading(true);
    try {
      const response = await api.get(`/collaboration/chat/rooms/${roomId}/messages`);
      setMessages(response.data);
      setSelectedRoom(roomId);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom) return;
    try {
      await api.post(`/collaboration/chat/rooms/${selectedRoom}/messages`, {
        content: newMessage,
        type: 'text'
      });
      setNewMessage('');
      fetchMessages(selectedRoom);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-3"><IconoTitulo e="💬" />Colaboración</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de salas */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Salas de Chat</h2>
          <div className="space-y-2">
            {rooms.map(room => (
              <div
                key={room.id}
                onClick={() => fetchMessages(room.id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedRoom === room.id ? 'bg-blue-100' : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="font-medium">{room.name}</div>
                <div className="text-sm text-gray-500">{room.message_count} mensajes</div>
              </div>
            ))}
          </div>
        </div>

        {/* Mensajes */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">
            {selectedRoom ? `Sala ${selectedRoom}` : 'Selecciona una sala'}
          </h2>
          
          {selectedRoom ? (
            <>
              <div className="h-96 overflow-y-auto mb-4 border rounded p-4">
                {loading ? (
                  <div className="text-center text-gray-500">Cargando...</div>
                ) : messages.length > 0 ? (
                  messages.map((msg, i) => (
                    <div key={i} className="mb-3">
                      <span className="font-medium text-blue-600">{msg.user_name}</span>
                      <span className="text-gray-500 text-sm ml-2">
                        {new Date(msg.created_at).toLocaleTimeString('es-CO')}
                      </span>
                      <p className="text-gray-800">{msg.content}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500">No hay mensajes</div>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 border rounded px-4 py-2"
                />
                <button
                  onClick={sendMessage}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Enviar
                </button>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 py-12">
              Selecciona una sala para empezar a chatear
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Collaboration;