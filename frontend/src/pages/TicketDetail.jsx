import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { categoria } from '../components/ui';

function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const fetchTicket = async () => {
    try {
      const response = await api.get(`/tickets/${id}`);
      setTicket(response.data);
    } catch (error) {
      console.error('Error fetching ticket:', error);
      navigate('/tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.put(`/tickets/${id}`, { status: newStatus });
      setTicket({ ...ticket, status: newStatus });
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const response = await api.post(`/tickets/${id}/comments`, { comment: newComment });
      setTicket({
        ...ticket,
        comments: [response.data, ...(ticket.comments || [])],
      });
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('¿Seguro que deseas eliminar este ticket?')) {
      try {
        await api.delete(`/tickets/${id}`);
        navigate('/tickets');
      } catch (error) {
        console.error('Error deleting ticket:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando ticket…</div>
      </div>
    );
  }

  if (!ticket) {
    return null;
  }

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      urgent: 'text-red-600',
    };
    return colors[priority] || 'text-gray-600';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/tickets')}
            className="text-gray-500 hover:text-gray-700 mb-2"
          >
            ← Volver a tickets
          </button>
          <h2 className="text-2xl font-bold text-gray-800">
            #{ticket.id} - {ticket.title}
          </h2>
        </div>
        <button
          onClick={handleDelete}
          className="px-4 py-2 text-red-600 hover:text-red-800 font-medium"
        >
          Eliminar ticket
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-2 space-y-6">
          {/* Ticket Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Detalles</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Descripción</label>
                <p className="mt-1 text-gray-700 whitespace-pre-wrap">
                  {ticket.description || 'Sin descripción'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Categoría</label>
                  <p className="mt-1 text-gray-700">{categoria(ticket.category) || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Creado</label>
                  <p className="mt-1 text-gray-700">
                    {new Date(ticket.created_at).toLocaleString('es-CO')}
                  </p>
                </div>
                {ticket.asset_id && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-500">Equipo afectado</label>
                    <p className="mt-1">
                      <Link to={`/assets/${ticket.asset_id}`} className="font-medium text-brand-600 hover:text-brand-700">
                        {ticket.asset_name || `Activo #${ticket.asset_id}`}
                      </Link>
                      {ticket.asset_serial && <span className="ml-2 text-sm text-gray-500">S/N {ticket.asset_serial}</span>}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Comentarios ({ticket.comments?.length || 0})
            </h3>

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="mb-6">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Escribe un comentario…"
              />
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="mt-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Agregando…' : 'Agregar comentario'}
              </button>
            </form>

            {/* Comments List */}
            <div className="space-y-4">
              {ticket.comments?.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aún no hay comentarios</p>
              ) : (
                ticket.comments?.map((comment) => (
                  <div key={comment.id} className="border-l-4 border-indigo-200 pl-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800">{comment.user_name}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(comment.created_at).toLocaleString('es-CO')}
                      </span>
                    </div>
                    <p className="mt-1 text-gray-600 whitespace-pre-wrap">{comment.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Estado</h3>
            <div className="space-y-2">
              {['open', 'in_progress', 'resolved', 'closed'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    ticket.status === status
                      ? `${getStatusColor(status)} font-medium`
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  {({ open: 'Abierto', in_progress: 'En progreso', resolved: 'Resuelto', closed: 'Cerrado' })[status] || status}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Prioridad</h3>
            <p className={`text-xl font-bold ${getPriorityColor(ticket.priority)}`}>
              {({ low: 'Baja', medium: 'Media', high: 'Alta', urgent: 'Urgente' })[ticket.priority] || ticket.priority}
            </p>
          </div>

          {/* Assigned To */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Asignado a</h3>
            <p className="text-gray-700">{ticket.assigned_to_name || 'Sin asignar'}</p>
          </div>

          {/* Created By */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Creado por</h3>
            <p className="text-gray-700">{ticket.created_by_name}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TicketDetail;
