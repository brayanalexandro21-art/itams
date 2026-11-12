import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';

function KnowledgeBase() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');

  useEffect(() => {
    fetchArticles();
    fetchCategories();
  }, [category, search]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (search) params.append('search', search);

      const response = await api.get(`/knowledgebase?${params.toString()}`);
      setArticles(response.data);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/knowledgebase/meta/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({ search, category });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Knowledge Base</h2>
        <Link
          to="/knowledgebase/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + New Article
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <form onSubmit={handleSearch} className="flex gap-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Search
          </button>
        </form>
      </div>

      {/* Articles List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 text-center py-8 text-gray-500">Loading articles...</div>
        ) : articles.length === 0 ? (
          <div className="col-span-2 text-center py-8 text-gray-500">
            No articles found.{' '}
            <Link to="/knowledgebase/new" className="text-indigo-600 hover:text-indigo-800">
              Create one
            </Link>
          </div>
        ) : (
          articles.map((article) => (
            <Link
              key={article.id}
              to={`/knowledgebase/${article.id}`}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 text-lg">{article.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    By {article.author_name} • {new Date(article.created_at).toLocaleDateString()}
                  </p>
                </div>
                {article.category && (
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full">
                    {article.category}
                  </span>
                )}
              </div>
              <p className="mt-3 text-gray-600 line-clamp-3">
                {article.content.substring(0, 200)}...
              </p>
              <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
                <span>👁️ {article.views} views</span>
                <span>👍 {article.helpful} helpful</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export default KnowledgeBase;
