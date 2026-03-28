import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';
import { useCart } from '../context/CartContext';

const fmt = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

export default function Cart() {
  const { cart, updateCart, removeFromCart, loading } = useCart();
  const navigate = useNavigate();
  const items = cart?.items || [];
  const totalPrice = cart?.totalPrice || 0;
  const shippingFee = totalPrice >= 250000 ? 0 : 30000;
  const finalTotal = totalPrice + shippingFee;

  return (
    <div>
      <Navbar />
      <div className="container page-wrapper" style={{ paddingTop: 24, paddingBottom: 48 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 24 }}>🛒 Giỏ hàng của tôi</h1>

        {items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🛒</div>
            <h3>Giỏ hàng trống</h3>
            <p>Hãy thêm sách vào giỏ hàng để tiếp tục mua sắm</p>
            <Link to="/books" className="btn btn-primary" style={{ marginTop: 16 }}>📚 Tiếp tục mua sắm</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
            {/* Cart Items */}
            <div>
              <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--gray-200)' }}>
                {items.map((item, idx) => {
                  const book = item.book;
                  if (!book) return null;
                  return (
                    <div key={item._id || book._id} style={{
                      display: 'flex', gap: 16, padding: '20px 24px',
                      borderBottom: idx < items.length - 1 ? '1px solid var(--gray-100)' : 'none',
                      alignItems: 'center',
                    }}>
                      {/* Image */}
                      <Link to={`/books/${book._id}`}>
                        <img src={book.imageUrl} alt={book.title} style={{ width: 80, height: 106, objectFit: 'cover', borderRadius: 8 }} />
                      </Link>
                      {/* Info */}
                      <div style={{ flex: 1 }}>
                        <Link to={`/books/${book._id}`} style={{ fontWeight: 700, fontSize: 15, color: 'var(--gray-900)', display: 'block', marginBottom: 4 }}>
                          {book.title}
                        </Link>
                        <p style={{ color: 'var(--primary)', fontWeight: 800, fontSize: 16, marginBottom: 8 }}>{fmt(item.price)}</p>
                        {/* Quantity */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', border: '2px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden' }}>
                            <button
                              onClick={() => item.quantity === 1 ? removeFromCart(book._id) : updateCart(book._id, item.quantity - 1)}
                              disabled={loading}
                              style={{ width: 36, height: 36, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}
                            >−</button>
                            <span style={{ width: 40, textAlign: 'center', fontWeight: 700 }}>{item.quantity}</span>
                            <button
                              onClick={() => updateCart(book._id, item.quantity + 1)}
                              disabled={loading || item.quantity >= (book.stock || 99)}
                              style={{ width: 36, height: 36, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}
                            >+</button>
                          </div>
                          <button onClick={() => removeFromCart(book._id)} style={{ color: 'var(--gray-400)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>🗑️ Xoá</button>
                        </div>
                      </div>
                      {/* Subtotal */}
                      <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--primary)', minWidth: 100, textAlign: 'right' }}>
                        {fmt(item.price * item.quantity)}
                      </div>
                    </div>
                  );
                })}
              </div>
              <Link to="/books" className="btn btn-ghost" style={{ marginTop: 16 }}>← Tiếp tục mua sắm</Link>
            </div>

            {/* Summary */}
            <div>
              <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: 24, border: '1px solid var(--gray-200)', position: 'sticky', top: 90 }}>
                <h3 style={{ fontWeight: 800, fontSize: 18, marginBottom: 20 }}>📋 Tóm tắt đơn hàng</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <span style={{ color: 'var(--gray-600)' }}>Tạm tính ({cart.totalItems} sản phẩm)</span>
                    <span style={{ fontWeight: 600 }}>{fmt(totalPrice)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <span style={{ color: 'var(--gray-600)' }}>Phí vận chuyển</span>
                    <span style={{ color: shippingFee === 0 ? 'var(--success)' : 'var(--gray-900)', fontWeight: 600 }}>
                      {shippingFee === 0 ? 'Miễn phí 🎉' : fmt(shippingFee)}
                    </span>
                  </div>
                  {totalPrice < 250000 && (
                    <p style={{ fontSize: 12, color: 'var(--gray-500)', background: 'var(--gray-50)', padding: '8px 10px', borderRadius: 8 }}>
                      💡 Mua thêm {fmt(250000 - totalPrice)} để được miễn phí vận chuyển!
                    </p>
                  )}
                  <hr className="divider" />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 900 }}>
                    <span>Tổng cộng</span>
                    <span style={{ color: 'var(--primary)' }}>{fmt(finalTotal)}</span>
                  </div>
                </div>
                <button className="btn btn-primary btn-block btn-lg" onClick={() => navigate('/checkout')}>
                  🚀 Tiến hành đặt hàng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
