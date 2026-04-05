import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { wishlistAPI } from '../services/api';
import '../styles/Wishlist.css';

export default function WishlistPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    fetchWishlist();
  }, [user, navigate]);

  const fetchWishlist = async () => {
    try {
      const res = await wishlistAPI.getWishlist();
      setWishlist(res.data.data);
      setLoading(false);
    } catch (err) {
      console.error('Lỗi lấy danh sách yêu thích:', err);
      setLoading(false);
    }
  };

  const handleRemove = async (bookId) => {
    try {
      await wishlistAPI.removeFromWishlist(bookId);
      setWishlist(prev => ({
        ...prev,
        books: prev.books.filter(b => b._id !== bookId)
      }));
    } catch (err) {
      console.error('Lỗi xóa sách:', err);
    }
  };

  const handleViewBook = (bookId) => {
    navigate(`/books/${bookId}`);
  };

  if (!user) {
    return <div className="wishlist-page"><p>Vui lòng đăng nhập</p></div>;
  }

  if (loading) {
    return <div className="wishlist-page"><p>💫 Đang tải...</p></div>;
  }

  const books = wishlist?.books || [];

  return (
    <div className="wishlist-page">
      <div className="wishlist-header">
        <h1>❤️ Danh sách yêu thích</h1>
        <p className="subtitle">
          {books.length === 0 ? '📚 Chưa có sách nào' : `📖 ${books.length} cuốn sách`}
        </p>
      </div>

      {books.length === 0 ? (
        <div className="wishlist-empty">
          <div className="empty-icon">📚</div>
          <p>Danh sách yêu thích của bạn trống</p>
          <button onClick={() => navigate('/books')} className="btn-continue">
            ➜ Tiếp tục mua sắm
          </button>
        </div>
      ) : (
        <div className="wishlist-grid">
          {books.map(book => (
            <div key={book._id} className="wishlist-card">
              <div 
                className="card-image"
                onClick={() => handleViewBook(book._id)}
              >
                <img src={book.imageUrl} alt={book.title} />
                <span className="badge-new">{book.category?.name || '📖'}</span>
              </div>
              
              <div className="card-content">
                <h3 
                  className="book-title"
                  onClick={() => handleViewBook(book._id)}
                >
                  {book.title}
                </h3>
                
                <p className="book-author">✍️ {book.author}</p>
                
                <div className="book-rating">
                  {'⭐'.repeat(Math.floor(book.rating || 4))} 
                  <span>({book.reviewCount || 0})</span>
                </div>

                <div className="book-price">
                  {book.price.toLocaleString('vi-VN')} ₫
                </div>

                <div className="card-actions">
                  <button 
                    onClick={() => handleViewBook(book._id)}
                    className="btn-view"
                  >
                    👁️ Xem
                  </button>
                  <button 
                    onClick={() => handleRemove(book._id)}
                    className="btn-remove"
                  >
                    ❌ Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
