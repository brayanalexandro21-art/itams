import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

function ArticleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    try {
      const response = await api.get(`/knowledgebase/${id}`);
      setArticle(response.data);
    } catch (error) {
      console.error('Error fetching article:', error);
      navigate('/knowledgebase');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkHelpful = async () => {
    try {
      await api.post(`/knowledgebase/${id}/helpful`);
      setArticle({ ...article, helpful: article.helpful + 1 });
    } catch (error) {
      console.error('Error marking helpful:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const response = await api.post(`/knowledgebase/${id}/comments`, { comment: newComment });
      setArticle({
        ...article,
        comments: [response.data, ...(article.comments || [])],
      });
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this article?')) {
      try {
        await api.delete(`/knowledgebase/${id}`);
        navigate('/knowledgebase');
      } catch (error) {
        console.error('Error deleting article:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading article...</div>
      </div>
    );
  }

  if (!article) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link to="/knowledgebase" className="text-gray-500 hover:text-gray-700 mb-2">
            ← Back to Knowledge Base
          </Link>
          <h2 className="text-2xl font-bold text-gray-800">{article.title}</h2>
          <p className="text-sm text-gray-500 mt-1">
            By {article.author_name} • {new Date(article.created_at).toLocaleDateString()}
            {article.category && (
              <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                {article.category}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={handleDelete}
          className="px-4 py-2 text-red-600 hover:text-red-800 font-medium"
        >
          Delete Article
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="prose max-w-none">
              {article.content.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-4 text-gray-700">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          {/* Comments */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Comments ({article.comments?.length || 0})
            </h3>

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="mb-6">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Add a comment or feedback..."
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
              {article.comments?.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No comments yet</p>
              ) : (
                article.comments?.map((comment) => (
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
          {/* Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Article Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Views</span>
                <span className="font-medium text-gray-800">{article.views}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Helpful</span>
                <span className="font-medium text-gray-800">{article.helpful}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Actions</h3>
            <div className="space-y-2">
              <button
                onClick={handleMarkHelpful}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                👍 Mark as Helpful
              </button>
              <Link
                to={`/tickets/new?kb=${article.id}`}
                className="block w-full text-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Create Ticket
              </Link>
              <Link
                to="/knowledgebase"
                className="block w-full text-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                View All Articles
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ArticleDetail;
