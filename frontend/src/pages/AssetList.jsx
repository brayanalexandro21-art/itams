import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';

function AssetList() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    type: searchParams.get('type') || '',
    status: searchParams.get('status') || '',
    category: searchParams.get('category') || '',
  });

  useEffect(() => {
    fetchAssets();
  }, [filters]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);

      const response = await api.get(`/assets?${params.toString()}`);
      setAssets(response.data);
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setSearchParams(newFilters);
  };

  const getStatusColor = (status) => {
    const colors = {
      available: 'bg-green-100 text-green-800',
      in_use: 'bg-blue-100 text-blue-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      retired: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type) => {
    const icons = {
      computer: '🖥️',
      laptop: '💻',
      printer: '🖨️',
      phone: '📱',
      server: '🖧',
      network: '🌐',
      software: '💿',
      other: '📦',
    };
    return icons[type] || '📦';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">IT Assets</h2>
        <Link
          to="/assets/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + New Asset
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Types</option>
              <option value="computer">Computer</option>
              <option value="laptop">Laptop</option>
              <option value="printer">Printer</option>
              <option value="phone">Phone</option>
              <option value="server">Server</option>
              <option value="network">Network</option>
              <option value="software">Software</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Status</option>
              <option value="available">Available</option>
              <option value="in_use">In Use</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Categories</option>
              <option value="hardware">Hardware</option>
              <option value="software">Software</option>
              <option value="peripheral">Peripheral</option>
              <option value="license">License</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center py-8 text-gray-500">Loading assets...</div>
        ) : assets.length === 0 ? (
          <div className="col-span-3 text-center py-8 text-gray-500">
            No assets found.{' '}
            <Link to="/assets/new" className="text-indigo-600 hover:text-indigo-800">
              Add one
            </Link>
          </div>
        ) : (
          assets.map((asset) => (
            <Link
              key={asset.id}
              to={`/assets/${asset.id}`}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <span className="text-3xl mr-3">{getTypeIcon(asset.type)}</span>
                  <div>
                    <h3 className="font-semibold text-gray-800">{asset.name}</h3>
                    <p className="text-sm text-gray-500">{asset.model || asset.type}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(asset.status)}`}>
                  {asset.status.replace('_', ' ')}
                </span>
              </div>
              <div className="mt-4 space-y-2">
                {asset.serial_number && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">S/N:</span> {asset.serial_number}
                  </p>
                )}
                {asset.location && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Location:</span> {asset.location}
                  </p>
                )}
                {asset.assigned_to_name && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Assigned to:</span> {asset.assigned_to_name}
                  </p>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export default AssetList;
