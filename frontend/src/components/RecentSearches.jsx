import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { searchHistoryAPI } from '../services/api';
import './RecentSearches.css';

export default function RecentSearches() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchSearchHistory();
  }, [user]);

  const fetchSearchHistory = async () => {
    try {
      const res = await searchHistoryAPI.getSearchHistory({ limit: 10 });
      setSearches(res.data.data || []);
    } catch (err) {
      console.error('Lỗi lấy lịch sử tìm kiếm:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (keyword) => {
    navigate(`/books?search=${encodeURIComponent(keyword)}`);
  };

  const handleDelete = async (searchId) => {
    try {
      await searchHistoryAPI.deleteSearchHistory(searchId);
      setSearches(searches.filter(s => s._id !== searchId));
    } catch (err) {
      console.error('Lỗi xóa tìm kiếm:', err);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Bạn chắc chắn muốn xóa toàn bộ lịch sử tìm kiếm?')) {
      try {
        await searchHistoryAPI.clearSearchHistory();
        setSearches([]);
      } catch (err) {
        console.error('Lỗi xóa lịch sử:', err);
      }
    }
  };

  if (!user || loading) return null;

  if (searches.length === 0) {
    return null;
  }

  return (
    <div className="recent-searches">
      <div className="searches-header">
        <h3>🔍 Tìm kiếm gần đây</h3>
        <button 
          onClick={handleClearAll}
          className="btn-clear-all"
          title="Xóa toàn bộ lịch sử"
        >
          🗑️
        </button>
      </div>

      <div className="searches-list">
        {searches.slice(0, 5).map(search => (
          <div key={search._id} className="search-item">
            <div className="search-content">
              <button 
                onClick={() => handleSearch(search.keyword)}
                className="search-keyword"
              >
                <span className="keyword-text">{search.keyword}</span>
              </button>
              <span className="results-count">
                {search.resultsCount} kết quả
              </span>
            </div>
            <button 
              onClick={() => handleDelete(search._id)}
              className="btn-delete"
              title="Xóa tìm kiếm này"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {searches.length > 5 && (
        <a href="/search-history" className="link-view-all">
          ➜ Xem toàn bộ lịch sử
        </a>
      )}
    </div>
  );
}
