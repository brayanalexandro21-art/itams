import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

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
    if (window.confirm('Are you sure you want to delete this ticket?')) {
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
        <div className="text-gray-500">Loading ticket...</div>
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
            ← Back to Tickets
          </button>
          <h2 className="text-2xl font-bold text-gray-800">
            #{ticket.id} - {ticket.title}
          </h2>
        </div>
        <button
          onClick={handleDelete}
          className="px-4 py-2 text-red-600 hover:text-red-800 font-medium"
        >
          Delete Ticket
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-2 space-y-6">
          {/* Ticket Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Details</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="mt-1 text-gray-700 whitespace-pre-wrap">
                  {ticket.description || 'No description provided'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <p className="mt-1 text-gray-700">{ticket.category || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="mt-1 text-gray-700">
                    {new Date(ticket.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Comments ({ticket.comments?.length || 0})
            </h3>

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="mb-6">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Add a comment..."
              />
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="mt-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Adding...' : 'Add Comment'}
              </button>
            </form>

            {/* Comments List */}
            <div className="space-y-4">
              {ticket.comments?.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No comments yet</p>
              ) : (
                ticket.comments?.map((comment) => (
                  <div key={comment.id} className="border-l-4 border-indigo-200 pl-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800">{comment.user_name}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(comment.created_at).toLocaleString()}
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
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Status</h3>
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
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Priority</h3>
            <p className={`text-xl font-bold ${getPriorityColor(ticket.priority)}`}>
              {ticket.priority.toUpperCase()}
            </p>
          </div>

          {/* Assigned To */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Assigned To</h3>
            <p className="text-gray-700">{ticket.assigned_to_name || 'Unassigned'}</p>
          </div>

          {/* Created By */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Created By</h3>
            <p className="text-gray-700">{ticket.created_by_name}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TicketDetail;
