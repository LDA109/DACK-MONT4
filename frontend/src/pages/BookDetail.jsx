import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';
import { bookAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

const fmt = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

export default function BookDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [book, setBook] = useState(null);
  const [related, setRelated] = useState([]);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    bookAPI.getBook(id).then(r => {
      setBook(r.data.data);
      setRelated(r.data.related || []);
      setLoading(false);
    });
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) return <div><Navbar /><div className="spinner-wrapper"><div className="spinner" /></div></div>;
  if (!book) return <div><Navbar /><div className="empty-state"><h3>Không tìm thấy sách</h3></div></div>;

  return (
    <div>
      <Navbar />
      <div className="container page-wrapper" style={{ paddingTop: 24, paddingBottom: 48 }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20, fontSize: 14, color: 'var(--gray-500)' }}>
          <Link to="/" style={{ color: 'var(--primary)' }}>Trang chủ</Link>
          <span>›</span>
          <Link to="/books" style={{ color: 'var(--primary)' }}>Sách</Link>
          <span>›</span>
          <span>{book.title}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 32, marginBottom: 40 }}>
          {/* Image */}
          <div>
            <div style={{ background: 'var(--gray-100)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', padding: 20, textAlign: 'center', marginBottom: 16 }}>
              <img src={book.imageUrl} alt={book.title} style={{ maxHeight: 400, margin: '0 auto', borderRadius: 8, boxShadow: 'var(--shadow-lg)' }} />
            </div>
            {/* Badges */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {book.isFlashSale && <span className="badge badge-red">⚡ Flash Sale</span>}
              {book.isBestseller && <span className="badge badge-orange">🏆 Bán chạy</span>}
              {book.isTrending && <span className="badge badge-blue">🔥 Xu hướng</span>}
              {book.type === 'manga' && <span className="badge" style={{ background: '#f3e5f5', color: '#6a1b9a' }}>🎌 Manga</span>}
            </div>
          </div>

          {/* Info */}
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--gray-900)', marginBottom: 8 }}>{book.title}</h1>
            <p style={{ color: 'var(--gray-600)', fontSize: 15, marginBottom: 4 }}>
              Tác giả: <strong style={{ color: 'var(--primary)' }}>{book.author}</strong>
            </p>
            {book.publisher && <p style={{ color: 'var(--gray-500)', fontSize: 14, marginBottom: 4 }}>NXB: {book.publisher}</p>}
            {book.seriesName && <p style={{ color: 'var(--gray-500)', fontSize: 14, marginBottom: 4 }}>Bộ truyện: {book.seriesName} {book.volume ? `- Tập ${book.volume}` : ''}</p>}
            {book.publishYear && <p style={{ color: 'var(--gray-500)', fontSize: 14, marginBottom: 12 }}>Năm xuất bản: {book.publishYear}</p>}

            {/* Rating */}
            {book.rating > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[1,2,3,4,5].map(i => (
                    <span key={i} style={{ color: i <= Math.round(book.rating) ? 'var(--gold)' : 'var(--gray-300)', fontSize: 18 }}>★</span>
                  ))}
                </div>
                <span style={{ fontWeight: 700, color: 'var(--gray-700)' }}>{book.rating.toFixed(1)}</span>
                <span style={{ color: 'var(--gray-500)', fontSize: 14 }}>({book.ratingCount} đánh giá)</span>
                <span style={{ color: 'var(--gray-400)' }}>|</span>
                <span style={{ color: 'var(--gray-500)', fontSize: 14 }}>Đã bán: <strong>{book.sold?.toLocaleString()}</strong></span>
              </div>
            )}

            {/* Price */}
            <div style={{ background: 'var(--primary-light)', borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: 'var(--primary)' }}>{fmt(book.price)}</span>
                {book.originalPrice > book.price && (
                  <span style={{ fontSize: 16, color: 'var(--gray-400)', textDecoration: 'line-through' }}>{fmt(book.originalPrice)}</span>
                )}
                {book.discount > 0 && (
                  <span className="badge badge-red" style={{ fontSize: 14, padding: '4px 10px' }}>-{book.discount}%</span>
                )}
              </div>
              {book.stock !== undefined && (
                <p style={{ fontSize: 13, color: book.stock > 0 ? 'var(--success)' : 'var(--primary)', marginTop: 4, fontWeight: 600 }}>
                  {book.stock > 0 ? `✅ Còn hàng (${book.stock} sản phẩm)` : '❌ Hết hàng'}
                </p>
              )}
            </div>

            {/* Quantity + Add */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '2px solid var(--gray-200)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 40, height: 42, background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--gray-600)' }}>−</button>
                <span style={{ width: 50, textAlign: 'center', fontWeight: 700 }}>{qty}</span>
                <button onClick={() => setQty(q => Math.min(book.stock, q + 1))} style={{ width: 40, height: 42, background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--gray-600)' }}>+</button>
              </div>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => addToCart(book._id, qty)} disabled={book.stock === 0}>
                🛒 Thêm vào giỏ hàng
              </button>
            </div>

            {/* Book details table */}
            <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
              <tbody>
                {[
                  ['Thể loại', book.category?.name],
                  ['Loại', book.type === 'manga' ? '🎌 Manga' : '📖 Sách'],
                  ['Ngôn ngữ', book.language],
                  ['Số trang', book.pages || '-'],
                ].map(([k, v]) => v && (
                  <tr key={k}>
                    <td style={{ padding: '6px 0', color: 'var(--gray-500)', width: 120 }}>{k}:</td>
                    <td style={{ padding: '6px 0', fontWeight: 600 }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Description */}
        {book.description && (
          <div className="card" style={{ padding: 24, marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>📄 Mô tả sách</h2>
            <p style={{ lineHeight: 1.8, color: 'var(--gray-700)' }}>{book.description}</p>
          </div>
        )}

        {/* Related */}
        {related.length > 0 && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>📚 Sách liên quan</h2>
            <div className="books-grid-wide">
              {related.map(b => (
                <div key={b._id} className="product-card" onClick={() => window.location.href = `/books/${b._id}`} style={{ cursor: 'pointer' }}>
                  <div className="img-wrapper"><img src={b.imageUrl} alt={b.title} /></div>
                  <div className="info">
                    <p className="title">{b.title}</p>
                    <p className="author">{b.author}</p>
                    <p className="price">{fmt(b.price)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
