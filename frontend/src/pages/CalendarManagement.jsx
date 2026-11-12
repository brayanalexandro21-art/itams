import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { IconoTitulo } from '../components/Icono';

const CalendarManagement = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('');
  const [newEvent, setNewEvent] = useState({
    title: '', description: '', start_date: '', end_date: '', type: 'meeting', reminder: 15
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, [filter]);

  const fetchEvents = async () => {
    try {
      const url = filter ? `/calendar-management?type=${filter}` : '/calendar-management';
      const response = await api.get(url);
      setEvents(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async () => {
    try {
      await api.post('/calendar-management', newEvent);
      setShowCreate(false);
      setNewEvent({ title: '', description: '', start_date: '', end_date: '', type: 'meeting', reminder: 15 });
      fetchEvents();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const deleteEvent = async (id) => {
    if (!confirm('¿Eliminar este evento?')) return;
    try {
      await api.delete(`/calendar-management/${id}`);
      setSelectedEvent(null);
      fetchEvents();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'meeting': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'deadline': return 'bg-red-100 text-red-800';
      case 'reminder': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-3"><IconoTitulo e="📅" />Calendario</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          + Nuevo Evento
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Crear Evento</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input type="text" value={newEvent.title} onChange={(e) => setNewEvent({...newEvent, title: e.target.value})} placeholder="Título" className="border rounded px-3 py-2 col-span-2" />
            <input type="datetime-local" value={newEvent.start_date} onChange={(e) => setNewEvent({...newEvent, start_date: e.target.value})} className="border rounded px-3 py-2" />
            <input type="datetime-local" value={newEvent.end_date} onChange={(e) => setNewEvent({...newEvent, end_date: e.target.value})} className="border rounded px-3 py-2" />
            <select value={newEvent.type} onChange={(e) => setNewEvent({...newEvent, type: e.target.value})} className="border rounded px-3 py-2">
              <option value="meeting">Reunión</option>
              <option value="maintenance">Mantenimiento</option>
              <option value="deadline">Fecha límite</option>
              <option value="reminder">Recordatorio</option>
            </select>
            <select value={newEvent.reminder} onChange={(e) => setNewEvent({...newEvent, reminder: parseInt(e.target.value)})} className="border rounded px-3 py-2">
              <option value={0}>Sin recordatorio</option>
              <option value={5}>5 minutos antes</option>
              <option value={15}>15 minutos antes</option>
              <option value={30}>30 minutos antes</option>
              <option value={60}>1 hora antes</option>
              <option value={1440}>1 día antes</option>
            </select>
            <textarea value={newEvent.description} onChange={(e) => setNewEvent({...newEvent, description: e.target.value})} placeholder="Descripción" className="border rounded px-3 py-2 col-span-2" rows={3} />
          </div>
          <div className="flex gap-2">
            <button onClick={createEvent} className="bg-green-500 text-white px-4 py-2 rounded">Crear</button>
            <button onClick={() => setShowCreate(false)} className="bg-gray-300 px-4 py-2 rounded">Cancelar</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full border rounded px-3 py-2">
              <option value="">Todos los tipos</option>
              <option value="meeting">Reuniones</option>
              <option value="maintenance">Mantenimiento</option>
              <option value="deadline">Fechas límite</option>
              <option value="reminder">Recordatorios</option>
            </select>
          </div>
          <div className="space-y-2">
            {events.map(event => (
              <div
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className={`p-3 rounded-lg cursor-pointer ${selectedEvent?.id === event.id ? 'bg-blue-100' : 'bg-gray-50 hover:bg-gray-100'}`}
              >
                <div className="font-medium text-sm">{event.title}</div>
                <div className="text-xs text-gray-500">{new Date(event.start_date).toLocaleDateString('es-CO')}</div>
                <span className={`text-xs px-2 py-0.5 rounded mt-1 inline-block ${getTypeColor(event.type)}`}>{event.type}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          {selectedEvent ? (
            <>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-semibold">{selectedEvent.title}</h2>
                  <span className={`text-xs px-2 py-1 rounded ${getTypeColor(selectedEvent.type)}`}>{selectedEvent.type}</span>
                </div>
                <button onClick={() => deleteEvent(selectedEvent.id)} className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm">Eliminar</button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div><span className="text-gray-500">Inicio:</span> {new Date(selectedEvent.start_date).toLocaleString('es-CO')}</div>
                <div><span className="text-gray-500">Fin:</span> {new Date(selectedEvent.end_date).toLocaleString('es-CO')}</div>
                <div><span className="text-gray-500">Recordatorio:</span> {selectedEvent.reminder} minutos antes</div>
                <div><span className="text-gray-500">Creado por:</span> {selectedEvent.created_by_name}</div>
              </div>

              {selectedEvent.description && (
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">Descripción</h3>
                  <p className="text-gray-600">{selectedEvent.description}</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 py-12">Selecciona un evento</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarManagement;