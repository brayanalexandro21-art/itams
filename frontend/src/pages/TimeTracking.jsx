import { useState, useEffect } from 'react';
import api from '../services/api';

function TimeTracking() {
  const [entries, setEntries] = useState([]);
  const [activeEntry, setActiveEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showManual, setShowManual] = useState(false);
  const [manualData, setManualData] = useState({
    ticket_id: '',
    description: '',
    duration_minutes: 60,
  });
  const [tickets, setTickets] = useState([]);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    fetchEntries();
    fetchTickets();
  }, []);

  useEffect(() => {
    let interval;
    if (activeEntry) {
      const startTime = new Date(activeEntry.start_time).getTime();
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeEntry]);

  const fetchEntries = async () => {
    try {
      const response = await api.get('/time/my');
      setEntries(response.data.entries);
      // Find active entry
      const active = response.data.entries.find(e => !e.end_time);
      setActiveEntry(active);
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    try {
      const response = await api.get('/tickets');
      setTickets(response.data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  const handleStart = async (ticketId) => {
    try {
      await api.post('/time/start', { ticket_id: ticketId });
      fetchEntries();
    } catch (error) {
      console.error('Error starting timer:', error);
    }
  };

  const handleStop = async () => {
    if (!activeEntry) return;
    try {
      await api.post('/time/stop', { entry_id: activeEntry.id });
      setActiveEntry(null);
      setElapsedTime(0);
      fetchEntries();
    } catch (error) {
      console.error('Error stopping timer:', error);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/time/manual', manualData);
      setShowManual(false);
      setManualData({ ticket_id: '', description: '', duration_minutes: 60 });
      fetchEntries();
    } catch (error) {
      console.error('Error adding manual entry:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this time entry?')) {
      try {
        await api.delete(`/time/${id}`);
        fetchEntries();
      } catch (error) {
        console.error('Error deleting entry:', error);
      }
    }
  };

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatMinutes = (minutes) => {
    if (!minutes) return '0h 0m';
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return `${h}h ${m}m`;
  };

  const totalMinutes = entries.reduce((sum, e) => sum + (e.duration || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Time Tracking</h2>
        <button
          onClick={() => setShowManual(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          + Add Time Manually
        </button>
      </div>

      {/* Active Timer */}
      {activeEntry && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-200 text-sm">Currently Tracking</p>
              <p className="text-xl font-semibold mt-1">
                Ticket #{activeEntry.ticket_id}
              </p>
              <p className="text-indigo-200 text-sm mt-1">
                {activeEntry.description || 'No description'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-mono font-bold">
                {formatDuration(elapsedTime)}
              </p>
              <button
                onClick={handleStop}
                className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Stop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Start */}
      {!activeEntry && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-medium text-gray-800 mb-4">Quick Start Timer</h3>
          <div className="flex flex-wrap gap-2">
            {tickets.slice(0, 5).map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => handleStart(ticket.id)}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
              >
                #{ticket.id} - {ticket.title.substring(0, 20)}...
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Entries</p>
          <p className="text-2xl font-bold text-gray-800">{entries.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Time</p>
          <p className="text-2xl font-bold text-gray-800">{formatMinutes(totalMinutes)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Average per Entry</p>
          <p className="text-2xl font-bold text-gray-800">
            {entries.length > 0 ? formatMinutes(totalMinutes / entries.length) : '0h 0m'}
          </p>
        </div>
      </div>

      {/* Entries List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-medium text-gray-800">Time Entries</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No time entries yet</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {entries.map((entry) => (
                <tr key={entry.id} className={!entry.end_time ? 'bg-indigo-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(entry.start_time).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    #{entry.ticket_id}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {entry.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                    {entry.end_time ? formatMinutes(entry.duration) : (
                      <span className="text-indigo-600">Running...</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {!entry.end_time ? (
                      <button
                        onClick={handleStop}
                        className="text-red-600 hover:text-red-800"
                      >
                        Stop
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Manual Entry Modal */}
      {showManual && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Time Manually</h3>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ticket *</label>
                <select
                  value={manualData.ticket_id}
                  onChange={(e) => setManualData({ ...manualData, ticket_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Select ticket</option>
                  {tickets.map((t) => (
                    <option key={t.id} value={t.id}>
                      #{t.id} - {t.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={manualData.description}
                  onChange={(e) => setManualData({ ...manualData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes) *</label>
                <input
                  type="number"
                  value={manualData.duration_minutes}
                  onChange={(e) => setManualData({ ...manualData, duration_minutes: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min="1"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button type="button" onClick={() => setShowManual(false)} className="px-4 py-2 text-gray-700">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  Add Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TimeTracking;
