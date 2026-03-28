import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';
import { orderAPI } from '../services/api';
import toast from 'react-hot-toast';

const fmt = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

const STATUS_MAP = {
  pending: { label: 'Chờ xử lý', color: 'orange', icon: '⏳' },
  confirmed: { label: 'Đã xác nhận', color: 'blue', icon: '✅' },
  shipping: { label: 'Đang giao', color: 'blue', icon: '🚚' },
  delivered: { label: 'Đã giao', color: 'green', icon: '✅' },
  cancelled: { label: 'Đã huỷ', color: 'red', icon: '❌' },
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderAPI.getMyOrders().then(r => { setOrders(r.data.data || []); setLoading(false); });
  }, []);

  const cancelOrder = async (id) => {
    if (!confirm('Bạn chắc chắn muốn huỷ đơn hàng này?')) return;
    try {
      await orderAPI.cancelOrder(id);
      setOrders(prev => prev.map(o => o._id === id ? { ...o, status: 'cancelled' } : o));
      toast.success('Đã huỷ đơn hàng');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Huỷ đơn thất bại');
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container page-wrapper" style={{ paddingTop: 24, paddingBottom: 48 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 24 }}>📦 Đơn hàng của tôi</h1>
        {loading ? <div className="spinner-wrapper"><div className="spinner" /></div>
          : orders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h3>Chưa có đơn hàng</h3>
              <p>Hãy mua sắm và đặt hàng đầu tiên của bạn!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {orders.map(order => {
                const st = STATUS_MAP[order.status] || STATUS_MAP.pending;
                return (
                  <div key={order._id} className="card animate-fadeInUp" style={{ padding: 24, borderRadius: 'var(--radius-xl)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 15 }}>Đơn hàng #{order.orderCode}</div>
                        <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>{new Date(order.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span className={`badge badge-${st.color === 'green' ? 'green' : st.color === 'orange' ? 'orange' : st.color === 'red' ? 'red' : 'blue'}`}>
                          {st.icon} {st.label}
                        </span>
                        {order.status === 'pending' && (
                          <button onClick={() => cancelOrder(order._id)} className="btn btn-sm" style={{ color: 'var(--primary)', border: '1px solid var(--primary)', background: 'none' }}>Huỷ đơn</button>
                        )}
                      </div>
                    </div>
                    {/* Items */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                      {order.items.slice(0, 3).map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <img src={item.imageUrl} alt={item.title} style={{ width: 44, height: 58, objectFit: 'cover', borderRadius: 6 }} onError={(e) => { e.target.src = 'https://via.placeholder.com/44x58?text=Book'; }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>{item.title}</div>
                            <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>x{item.quantity} × {fmt(item.price)}</div>
                          </div>
                          <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{fmt(item.price * item.quantity)}</div>
                        </div>
                      ))}
                      {order.items.length > 3 && <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>+{order.items.length - 3} sản phẩm khác...</p>}
                    </div>
                    <hr className="divider" />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>Phương thức: </span>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{order.paymentMethod === 'cod' ? '💵 COD' : '🏦 Chuyển khoản'}</span>
                      </div>
                      <div style={{ fontWeight: 900, fontSize: 18, color: 'var(--primary)' }}>
                        Tổng: {fmt(order.finalTotal)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </div>
      <Footer />
    </div>
  );
}
