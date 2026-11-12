import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function Dashboard() {
  const [ticketStats, setTicketStats] = useState(null);
  const [assetStats, setAssetStats] = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);
  const [recentAssets, setRecentAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [ticketStatsRes, assetStatsRes, ticketsRes, assetsRes] = await Promise.all([
        api.get('/tickets/stats/summary'),
        api.get('/assets/stats/summary'),
        api.get('/tickets'),
        api.get('/assets'),
      ]);
      setTicketStats(ticketStatsRes.data);
      setAssetStats(assetStatsRes.data);
      setRecentTickets(ticketsRes.data.slice(0, 5));
      setRecentAssets(assetsRes.data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  const ticketStatCards = [
    { label: 'Total Tickets', value: ticketStats?.total || 0, color: 'bg-blue-500', icon: '🎫' },
    { label: 'Open', value: ticketStats?.open || 0, color: 'bg-yellow-500', icon: '📬' },
    { label: 'In Progress', value: ticketStats?.inProgress || 0, color: 'bg-orange-500', icon: '⏳' },
    { label: 'Unassigned', value: ticketStats?.unassigned || 0, color: 'bg-red-500', icon: '❓' },
  ];

  const assetStatCards = [
    { label: 'Total Assets', value: assetStats?.total || 0, color: 'bg-purple-500', icon: '💻' },
    { label: 'Available', value: assetStats?.available || 0, color: 'bg-green-500', icon: '✅' },
    { label: 'In Use', value: assetStats?.in_use || 0, color: 'bg-blue-500', icon: '🔧' },
    { label: 'Maintenance', value: assetStats?.maintenance || 0, color: 'bg-yellow-500', icon: '🛠️' },
  ];

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
      available: 'bg-green-100 text-green-800',
      in_use: 'bg-blue-100 text-blue-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      retired: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Ticket Stats */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Ticket Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {ticketStatCards.map((stat) => (
            <div key={stat.label} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`${stat.color} rounded-lg p-3 text-white text-2xl`}>
                  {stat.icon}
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Asset Stats */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Asset Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {assetStatCards.map((stat) => (
            <div key={stat.label} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`${stat.color} rounded-lg p-3 text-white text-2xl`}>
                  {stat.icon}
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tickets */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Recent Tickets</h3>
              <Link
                to="/tickets"
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                View All
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {recentTickets.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No tickets yet.{' '}
                <Link to="/tickets/new" className="text-indigo-600 hover:text-indigo-800">
                  Create your first ticket
                </Link>
              </div>
            ) : (
              recentTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  to={`/tickets/${ticket.id}`}
                  className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-800">
                          #{ticket.id}
                        </span>
                        <span className="text-gray-800">{ticket.title}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {ticket.created_by_name} • {new Date(ticket.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Assets */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Recent Assets</h3>
              <Link
                to="/assets"
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                View All
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {recentAssets.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No assets yet.{' '}
                <Link to="/assets/new" className="text-indigo-600 hover:text-indigo-800">
                  Add your first asset
                </Link>
              </div>
            ) : (
              recentAssets.map((asset) => (
                <Link
                  key={asset.id}
                  to={`/assets/${asset.id}`}
                  className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="text-gray-800">{asset.name}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {asset.type} • {asset.manufacturer || 'Unknown'}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(asset.status)}`}>
                      {asset.status.replace('_', ' ')}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/tickets/new"
            className="flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <span className="mr-2">➕</span>
            New Ticket
          </Link>
          <Link
            to="/assets/new"
            className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <span className="mr-2">💻</span>
            New Asset
          </Link>
          <Link
            to="/knowledgebase/new"
            className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <span className="mr-2">📚</span>
            New Article
          </Link>
          <Link
            to="/notifications"
            className="flex items-center justify-center px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
          >
            <span className="mr-2">🔔</span>
            Notifications
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
