import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Monitor, X } from 'lucide-react';
import api from '../services/api';

function CreateTicket() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: '',
  });
  const [error, setError] = useState('');
  // Ticket abierto desde la ficha o el QR de un equipo: queda vinculado a ese activo
  const [params, setParams] = useSearchParams();
  const [activo, setActivo] = useState(null);
  const activoId = params.get('activo');

  useEffect(() => {
    if (!activoId) { setActivo(null); return; }
    api.get('/assets/' + activoId)
      .then((r) => {
        setActivo(r.data);
        setFormData((f) => ({ ...f, category: f.category || 'hardware' }));
      })
      .catch(() => setActivo(null));
  }, [activoId]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/tickets', { ...formData, asset_id: activo?.id || null });
      navigate('/tickets');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo crear el ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Nuevo ticket</h2>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {activo && (
            <div className="flex items-center gap-3 rounded-lg border border-brand-100 bg-brand-50 px-4 py-3">
              <Monitor className="h-5 w-5 shrink-0 text-brand-600" strokeWidth={1.8} />
              <div className="min-w-0 flex-1 text-sm">
                <p className="text-gray-500">Equipo afectado</p>
                <Link to={'/assets/' + activo.id} className="block truncate font-medium text-gray-900 hover:text-brand-700">
                  {activo.name}{activo.location ? ' · ' + activo.location : ''}
                </Link>
              </div>
              <button type="button" onClick={() => setParams({})} className="rounded p-1 text-gray-400 hover:bg-white hover:text-gray-600" aria-label="Quitar equipo">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Asunto *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Resumen breve del problema"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Describe el problema con el mayor detalle posible…"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioridad
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Selecciona una categoría</option>
                <option value="hardware">Hardware</option>
                <option value="software">Software</option>
                <option value="network">Red</option>
                <option value="email">Correo</option>
                <option value="access">Accesos y permisos</option>
                <option value="other">Otro</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/tickets')}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creando…' : 'Crear ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateTicket;
