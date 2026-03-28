import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

export default function ProductCard({ book }) {
  const { addToCart } = useCart();
  const { user } = useAuth();

  const discountPct = book.discount && book.discount > 0 ? book.discount : 0;

  return (
    <div className="product-card animate-fadeInUp">
      <Link to={`/books/${book._id}`}>
        <div className="img-wrapper">
          <img
            src={book.imageUrl || 'https://via.placeholder.com/200x280?text=No+Image'}
            alt={book.title}
            loading="lazy"
            onError={(e) => { e.target.src = 'https://via.placeholder.com/200x280?text=No+Image'; }}
          />
          {discountPct > 0 && <div className="badge">-{discountPct}%</div>}
          {book.type === 'manga' && <div className="badge badge-gold" style={{ top: 10, right: 10, left: 'auto' }}>Manga</div>}
          <div className="add-btn" onClick={(e) => { e.preventDefault(); addToCart(book._id); }}>
            🛒 Thêm vào giỏ
          </div>
        </div>
      </Link>
      <div className="info">
        <Link to={`/books/${book._id}`}>
          <p className="title">{book.title}</p>
        </Link>
        <p className="author">{book.author}</p>
        <div className="price-row">
          <span className="price">{formatPrice(book.price)}</span>
          {book.originalPrice > book.price && (
            <span className="original-price">{formatPrice(book.originalPrice)}</span>
          )}
          {discountPct > 0 && <span className="discount-badge">-{discountPct}%</span>}
        </div>
        {book.rating > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <span className="star">★</span>
            <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>{book.rating.toFixed(1)}</span>
          </div>
        )}
        <p className="sold">Đã bán: {(book.sold || 0).toLocaleString()}</p>
      </div>
    </div>
  );
}
