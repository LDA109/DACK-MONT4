import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';
import { bookAPI, reviewAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const fmt = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

export default function BookDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [book, setBook] = useState(null);
  const [related, setRelated] = useState([]);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    setLoading(true);
    bookAPI.getBook(id).then(r => {
      setBook(r.data.data);
      setRelated(r.data.related || []);
      setLoading(false);
    });
    // Fetch reviews
    reviewAPI.getReviewsByBook(id).then(r => {
      setReviews(Array.isArray(r.data?.data) ? r.data.data : []);
    }).catch(() => setReviews([]));
    window.scrollTo(0, 0);
  }, [id]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Vui lòng đăng nhập để bình luận');
      return;
    }
    if (!reviewForm.title.trim() || !reviewForm.comment.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    setSubmittingReview(true);
    try {
      await reviewAPI.createReview({
        bookId: id,
        rating: reviewForm.rating,
        title: reviewForm.title,
        comment: reviewForm.comment,
        isVerifiedPurchase: true,
      });
      toast.success('Bình luận đã được thêm!');
      setReviewForm({ rating: 5, title: '', comment: '' });
      setShowReviewForm(false);
      // Refresh reviews
      const r = await reviewAPI.getReviewsByBook(id);
      setReviews(Array.isArray(r.data?.data) ? r.data.data : []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi thêm bình luận');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa bình luận này?')) return;
    try {
      await reviewAPI.deleteReview(reviewId);
      toast.success('Bình luận đã được xóa');
      // Refresh reviews
      const r = await reviewAPI.getReviewsByBook(id);
      setReviews(Array.isArray(r.data?.data) ? r.data.data : []);
    } catch (err) {
      toast.error('Xóa bình luận thất bại');
    }
  };

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

        {/* Reviews Section */}
        <div className="card" style={{ padding: 24, marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>💬 Bình luận ({reviews.length})</h2>
            {user && (
              <button 
                className="btn btn-sm btn-primary"
                onClick={() => setShowReviewForm(!showReviewForm)}
              >
                {showReviewForm ? '✖ Hủy' : '➕ Viết bình luận'}
              </button>
            )}
            {!user && (
              <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>
                <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Đăng nhập</Link> để bình luận
              </p>
            )}
          </div>

          {/* Review Form */}
          {showReviewForm && user && (
            <form onSubmit={handleSubmitReview} style={{ background: 'var(--gray-50)', padding: 16, borderRadius: 8, marginBottom: 20 }}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Đánh giá</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[1,2,3,4,5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      style={{
                        fontSize: 28,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: star <= reviewForm.rating ? 'var(--gold)' : 'var(--gray-300)',
                        transition: 'color 0.2s'
                      }}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Tiêu đề</label>
                <input
                  type="text"
                  placeholder="Tiêu đề đánh giá..."
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: '1px solid var(--gray-300)',
                    fontSize: 13,
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Bình luận</label>
                <textarea
                  placeholder="Chia sẻ kinh nghiệm của bạn về cuốn sách này..."
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  style={{
                    width: '100%',
                    height: 80,
                    padding: '10px',
                    borderRadius: 6,
                    border: '1px solid var(--gray-300)',
                    fontSize: 13,
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={submittingReview}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                {submittingReview ? '⏳ Đang gửi...' : '✓ Gửi bình luận'}
              </button>
            </form>
          )}

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '20px 0' }}>
              <p>Chưa có bình luận nào. Hãy là người đầu tiên!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {reviews.map(review => (
                <div key={review._id} style={{ border: '1px solid var(--gray-200)', borderRadius: 8, padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <strong style={{ fontSize: 14 }}>{review.user?.name || 'Ān danh'}</strong>
                        {review.verified && <span style={{ fontSize: 11, background: 'var(--success)', color: 'white', padding: '2px 6px', borderRadius: 3 }}>✓ Đã mua</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <div style={{ display: 'flex', gap: 1 }}>
                          {[1,2,3,4,5].map(i => (
                            <span key={i} style={{ color: i <= review.rating ? 'var(--gold)' : 'var(--gray-300)', fontSize: 14 }}>★</span>
                          ))}
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>({review.rating})</span>
                      </div>
                      <h4 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px 0' }}>{review.title}</h4>
                      <p style={{ fontSize: 13, color: 'var(--gray-700)', margin: 0, lineHeight: 1.5 }}>{review.comment}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'end', gap: 8 }}>
                      <span style={{ fontSize: 11, color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>
                        {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                      {user && (user.role === 'admin' || user._id === review.user?._id) && (
                        <button
                          onClick={() => handleDeleteReview(review._id)}
                          style={{
                            background: 'var(--error)',
                            color: 'white',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                        >
                          🗑️ Xóa
                        </button>
                      )}
                    </div>
                  </div>
                  {review.adminReply?.comment && (
                    <div style={{ background: 'var(--gray-50)', padding: 10, borderRadius: 6, marginTop: 8, borderLeft: '3px solid var(--primary)' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', marginBottom: 4 }}>👨‍💼 Trả lời từ shop:</div>
                      <p style={{ fontSize: 12, color: 'var(--gray-700)', margin: 0 }}>{review.adminReply.comment}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

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
