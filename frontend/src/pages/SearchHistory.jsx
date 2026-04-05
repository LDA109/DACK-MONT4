import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { searchHistoryAPI } from '../services/api';
import '../styles/SearchHistory.css';

const formatPrice = (price) => {
  if (!price) return '0đ';
  return price.toLocaleString('vi-VN') + 'đ';
};

export default function SearchHistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchSearchHistory();
  }, [user, navigate]);

  const fetchSearchHistory = async () => {
    try {
      const res = await searchHistoryAPI.getSearchHistory({ limit: 100 });
      setSearches(res.data.data || []);
    } catch (err) {
      console.error('Lỗi lấy lịch sử:', err);
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
      console.error('Lỗi xóa:', err);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Xóa toàn bộ lịch sử tìm kiếm? Hành động này không thể hoàn tác.')) {
      try {
        await searchHistoryAPI.clearSearchHistory();
        setSearches([]);
      } catch (err) {
        console.error('Lỗi xóa:', err);
      }
    }
  };

  const getSortedSearches = () => {
    let sorted = [...searches];
    if (sortBy === 'newest') {
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'oldest') {
      sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'popular') {
      sorted.sort((a, b) => b.resultsCount - a.resultsCount);
    }
    return sorted;
  };

  if (!user) {
    return <div className="search-history-page"><p>Vui lòng đăng nhập</p></div>;
  }

  if (loading) {
    return <div className="search-history-page"><p>💫 Đang tải...</p></div>;
  }

  const sortedSearches = getSortedSearches();

  return (
    <div className="search-history-page">
      <div className="history-header">
        <h1>🔍 Lịch sử tìm kiếm</h1>
        <p className="subtitle">
          {searches.length === 0 
            ? 'Chưa có lịch sử tìm kiếm' 
            : `${searches.length} kết quả`
          }
        </p>
      </div>

      {searches.length > 0 && (
        <div className="history-controls">
          <div className="sort-control">
            <label>Sắp xếp:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="newest">🆕 Mới nhất</option>
              <option value="oldest">📅 Cũ nhất</option>
              <option value="popular">🔥 Nhiều kết quả</option>
            </select>
          </div>

          <button 
            onClick={handleClearAll}
            className="btn-clear-all"
          >
            🗑️ Xóa toàn bộ
          </button>
        </div>
      )}

      {sortedSearches.length === 0 ? (
        <div className="history-empty">
          <div className="empty-icon">🔍</div>
          <p>Lịch sử tìm kiếm trống</p>
          <button onClick={() => navigate('/books')} className="btn-start">
            👉 Bắt đầu tìm kiếm
          </button>
        </div>
      ) : (
        <div className="history-table">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Từ khóa tìm kiếm</th>
                <th>Bộ lọc</th>
                <th>Kết quả</th>
                <th>Thời gian</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {sortedSearches.map((search, index) => (
                <tr key={search._id}>
                  <td className="index">{index + 1}</td>
                  <td>
                    <button 
                      onClick={() => handleSearch(search.keyword)}
                      className="search-link"
                    >
                      {search.keyword || '(Không có từ khóa)'}
                    </button>
                  </td>
                  <td className="filters">
                    {search.filters?.category && <span className="filter-tag">📚 {search.filters.category}</span>}
                    {search.filters?.priceMin && <span className="filter-tag">💰 {formatPrice(search.filters.priceMin)}</span>}
                    {!search.filters?.category && !search.filters?.priceMin && '—'}
                  </td>
                  <td className="results">
                    <span className="results-badge">{search.resultsCount}</span>
                  </td>
                  <td className="time">
                    {new Date(search.createdAt).toLocaleString('vi-VN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="actions">
                    <button 
                      onClick={() => handleSearch(search.keyword)}
                      className="btn-action btn-search"
                      title="Tìm kiếm lại"
                    >
                      🔄
                    </button>
                    <button 
                      onClick={() => handleDelete(search._id)}
                      className="btn-action btn-delete"
                      title="Xóa"
                    >
                      ❌
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
