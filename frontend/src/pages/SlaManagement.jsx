import { useState, useEffect } from 'react';
import api from '../services/api';

function SlaManagement() {
  const [slas, setSlas] = useState([]);
  const [compliance, setCompliance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    response_time: 60,
    resolution_time: 480,
    priority: 'medium',
  });

  useEffect(() => {
    fetchSlas();
    fetchCompliance();
  }, []);

  const fetchSlas = async () => {
    try {
      const response = await api.get('/sla');
      setSlas(response.data);
    } catch (error) {
      console.error('Error fetching SLAs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompliance = async () => {
    try {
      const response = await api.get('/sla/report/compliance');
      setCompliance(response.data);
    } catch (error) {
      console.error('Error fetching compliance:', error);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/sla', formData);
      setShowCreate(false);
      setFormData({ name: '', description: '', response_time: 60, resolution_time: 480, priority: 'medium' });
      fetchSlas();
      fetchCompliance();
    } catch (error) {
      console.error('Error creating SLA:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this SLA?')) {
      try {
        await api.delete(`/sla/${id}`);
        fetchSlas();
        fetchCompliance();
      } catch (error) {
        console.error('Error deleting SLA:', error);
      }
    }
  };

  const formatMinutes = (minutes) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">SLA Management</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          + Create SLA
        </button>
      </div>

      {/* Compliance Overview */}
      {compliance.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">SLA Compliance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {compliance.map((sla) => (
              <div key={sla.id} className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-800">{sla.name}</h4>
                <div className="mt-3 space-y-2">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Response Time</span>
                      <span className={`font-medium ${sla.response_compliance >= 90 ? 'text-green-600' : sla.response_compliance >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {sla.response_compliance}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full mt-1">
                      <div
                        className={`h-full rounded-full ${sla.response_compliance >= 90 ? 'bg-green-500' : sla.response_compliance >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${sla.response_compliance}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Resolution Time</span>
                      <span className={`font-medium ${sla.resolution_compliance >= 90 ? 'text-green-600' : sla.resolution_compliance >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {sla.resolution_compliance}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full mt-1">
                      <div
                        className={`h-full rounded-full ${sla.resolution_compliance >= 90 ? 'bg-green-500' : sla.resolution_compliance >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${sla.resolution_compliance}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">{sla.total_tickets} tickets</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SLA List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : slas.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No SLAs configured</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Response Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resolution Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {slas.map((sla) => (
                <tr key={sla.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-800">{sla.name}</div>
                    <div className="text-sm text-gray-500">{sla.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {formatMinutes(sla.response_time)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {formatMinutes(sla.resolution_time)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">
                    {sla.priority}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${sla.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {sla.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleDelete(sla.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Create SLA</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Response Time (min)</label>
                  <input
                    type="number"
                    value={formData.response_time}
                    onChange={(e) => setFormData({ ...formData, response_time: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resolution Time (min)</label>
                  <input
                    type="number"
                    value={formData.resolution_time}
                    onChange={(e) => setFormData({ ...formData, resolution_time: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-700">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SlaManagement;
