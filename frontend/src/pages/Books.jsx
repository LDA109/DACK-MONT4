import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar/Navbar';
import ProductCard from '../components/ProductCard/ProductCard';
import Footer from '../components/Footer/Footer';
import { bookAPI, categoryAPI, searchHistoryAPI } from '../services/api';

const SORT_OPTIONS = [
  { key: 'newest', label: '🆕 Mới nhất' },
  { key: 'bestselling', label: '🏆 Bán chạy nhất' },
  { key: 'price-asc', label: '💰 Giá tăng dần' },
  { key: 'price-desc', label: '💰 Giá giảm dần' },
  { key: 'discount', label: '🔥 Giảm giá nhiều nhất' },
  { key: 'rating', label: '⭐ Đánh giá cao nhất' },
  { key: 'name-asc', label: '🔤 Tên A-Z' },
];

const TYPE_OPTIONS = [
  { key: '', label: 'Tất cả' },
  { key: 'book', label: '📖 Sách' },
  { key: 'manga', label: '🎌 Manga' },
];



export default function Books() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const search = params.get('search') || '';
  const category = params.get('category') || '';
  const type = params.get('type') || '';
  const sort = params.get('sort') || 'newest';
  const page = Number(params.get('page') || 1);
  const isFlashSale = params.get('isFlashSale') || '';
  const isBestseller = params.get('isBestseller') || '';
  const isTrending = params.get('isTrending') || '';
  


  useEffect(() => {
    categoryAPI.getCategories().then(r => setCategories(r.data.data || []));
  }, []);

  // Save search history khi user search (chỉ khi có keyword)
  useEffect(() => {
    if (search && user) {
      console.log('📝 Saving SearchHistory:', search);
      searchHistoryAPI.addSearchHistory({
        keyword: search,
        filters: { category },
        resultsCount: books.length
      })
        .then(() => console.log('✅ SearchHistory saved'))
        .catch(err => console.error('❌ Error saving SearchHistory:', err));
    }
  }, [search]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await bookAPI.getBooks({ search, category, type, sort, page, limit: 20, isFlashSale, isBestseller, isTrending });
        setBooks(res.data.data || []);
        setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
      } finally { setLoading(false); }
    };
    load();
  }, [search, category, type, sort, page, isFlashSale, isBestseller, isTrending]);



  const setParam = (key, value) => {
    const p = new URLSearchParams(params);
    if (value) p.set(key, value); else p.delete(key);
    p.delete('page');
    setParams(p);
  };

  const setPage = (pg) => {
    const p = new URLSearchParams(params);
    p.set('page', pg);
    setParams(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => setParams({});

  // Dynamic title
  let title = '📚 Tất Cả Sách';
  if (isFlashSale) title = '⚡ Flash Sale';
  if (isBestseller) title = '🏆 Sách Bán Chạy';
  if (isTrending) title = '🔥 Xu Hướng';
  if (type === 'manga') title = '🎌 Manga';
  if (search) title = `Kết quả: "${search}"`;

  return (
    <div>
      <Navbar />
      <div className="container page-wrapper" style={{ paddingTop: 24, paddingBottom: 48 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24 }}>
          {/* Sidebar Filters */}
          <aside>
            <div className="card" style={{ padding: 20, marginBottom: 16, borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16 }}>🔍 Bộ lọc</div>
              <button onClick={clearFilters} className="btn btn-outline btn-sm btn-block" style={{ marginBottom: 16 }}>Xoá bộ lọc</button>

              {/* Type */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--gray-600)', marginBottom: 8, textTransform: 'uppercase' }}>Loại sách</div>
                {TYPE_OPTIONS.map(o => (
                  <label key={o.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', cursor: 'pointer', fontSize: 14 }}>
                    <input type="radio" name="type" checked={type === o.key} onChange={() => setParam('type', o.key)} />
                    {o.label}
                  </label>
                ))}
              </div>



              <hr className="divider" />

              {/* Category */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--gray-600)', marginBottom: 8, textTransform: 'uppercase' }}>Danh mục</div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', cursor: 'pointer', fontSize: 14 }}>
                  <input type="radio" name="cat" checked={!category} onChange={() => setParam('category', '')} />
                  Tất cả
                </label>
                {categories.map(c => (
                  <label key={c._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', cursor: 'pointer', fontSize: 14 }}>
                    <input type="radio" name="cat" checked={category === c._id} onChange={() => setParam('category', c._id)} />
                    {c.icon} {c.name}
                  </label>
                ))}
              </div>

              <hr className="divider" />

              {/* Special */}
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--gray-600)', marginBottom: 8, textTransform: 'uppercase' }}>Khuyến mãi</div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', cursor: 'pointer', fontSize: 14 }}>
                  <input type="checkbox" checked={!!isFlashSale} onChange={(e) => setParam('isFlashSale', e.target.checked ? 'true' : '')} />
                  ⚡ Flash Sale
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', cursor: 'pointer', fontSize: 14 }}>
                  <input type="checkbox" checked={!!isBestseller} onChange={(e) => setParam('isBestseller', e.target.checked ? 'true' : '')} />
                  🏆 Bán chạy
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', cursor: 'pointer', fontSize: 14 }}>
                  <input type="checkbox" checked={!!isTrending} onChange={(e) => setParam('isTrending', e.target.checked ? 'true' : '')} />
                  🔥 Xu hướng
                </label>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div>
            <div style={{ marginBottom: 16 }}>
              <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>{title}</h1>
              <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>Tìm thấy <strong>{pagination.total}</strong> kết quả</p>
            </div>

            {/* Sort Bar */}
            <div className="sort-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <span className="sort-label">Sắp xếp:</span>
                {SORT_OPTIONS.map(o => (
                  <button key={o.key} className={`sort-btn ${sort === o.key ? 'active' : ''}`}
                    onClick={() => setParam('sort', o.key)}>{o.label}</button>
                ))}
              </div>

            </div>

            {loading ? (
              <div className="spinner-wrapper"><div className="spinner" /></div>
            ) : books.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3>Không tìm thấy sách</h3>
                <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
              </div>
            ) : (
              <div className="books-grid">
                {books.map(b => <ProductCard key={b._id} book={b} />)}
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="pagination">
                <button className="page-btn" onClick={() => setPage(page - 1)} disabled={page <= 1}>‹</button>
                {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => {
                  const pg = i + 1;
                  return <button key={pg} className={`page-btn ${page === pg ? 'active' : ''}`} onClick={() => setPage(pg)}>{pg}</button>;
                })}
                <button className="page-btn" onClick={() => setPage(page + 1)} disabled={page >= pagination.pages}>›</button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
