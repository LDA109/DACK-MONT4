import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';
import ProductCard from '../components/ProductCard/ProductCard';
import { bookAPI, categoryAPI } from '../services/api';

export default function CategoryPage() {
  const { slug } = useParams();
  const [books, setBooks] = useState([]);
  const [category, setCategory] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoryAPI.getCategory(slug).then(r => setCategory(r.data.data));
  }, [slug]);

  useEffect(() => {
    if (!category) return;
    setLoading(true);
    bookAPI.getBooks({ category: category._id, sort, page, limit: 20 })
      .then(r => { setBooks(r.data.data || []); setPagination(r.data.pagination); setLoading(false); });
  }, [category, sort, page]);

  const SORTS = ['newest', 'bestselling', 'price-asc', 'price-desc', 'discount', 'rating'];
  const SORT_LABELS = { newest: '🆕 Mới nhất', bestselling: '🏆 Bán chạy', 'price-asc': '💰 Giá tăng', 'price-desc': '💰 Giá giảm', discount: '🔥 Giảm giá', rating: '⭐ Đánh giá' };

  return (
    <div>
      <Navbar />
      <div className="container page-wrapper" style={{ paddingTop: 24, paddingBottom: 48 }}>
        {category && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 40 }}>{category.icon}</span>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 900 }}>{category.name}</h1>
              <p style={{ color: 'var(--gray-500)' }}>{category.description} · {pagination.total} sản phẩm</p>
            </div>
          </div>
        )}
        <div className="sort-bar" style={{ marginBottom: 20 }}>
          <span className="sort-label">Sắp xếp:</span>
          {SORTS.map(k => (
            <button key={k} className={`sort-btn ${sort === k ? 'active' : ''}`} onClick={() => { setSort(k); setPage(1); }}>{SORT_LABELS[k]}</button>
          ))}
        </div>
        {loading ? <div className="spinner-wrapper"><div className="spinner" /></div>
          : <div className="books-grid">{books.map(b => <ProductCard key={b._id} book={b} />)}</div>}
      </div>
      <Footer />
    </div>
  );
}
