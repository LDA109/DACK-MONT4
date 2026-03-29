import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderAPI, paymentAPI } from '../services/api';
import toast from 'react-hot-toast';

const fmt = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

export default function Checkout() {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: '',
    note: '',
    paymentMethod: 'cod',
  });

  const items = cart?.items || [];
  const totalPrice = cart?.totalPrice || 0;
  const shippingFee = totalPrice >= 250000 ? 0 : 30000;
  const finalTotal = totalPrice + shippingFee;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.city) { toast.error('Vui lòng chọn thành phố!'); return; }
    setLoading(true);
    try {
      const res = await orderAPI.createOrder({
        shippingAddress: { fullName: form.fullName, phone: form.phone, address: form.address, city: form.city },
        paymentMethod: form.paymentMethod,
        note: form.note,
      });

      // Nếu là VNPay, redirect sang trang thanh toán
      if (form.paymentMethod === 'vnpay') {
        try {
          const paymentRes = await paymentAPI.createVNPayPayment(res.data.data._id);
          // Redirect to VNPay
          window.location.href = paymentRes.data.data.paymentUrl;
        } catch (err) {
          toast.error(err.response?.data?.message || 'Lỗi tạo thanh toán VNPay');
          setLoading(false);
        }
      } else {
        await clearCart();
        toast.success('Đặt hàng thành công! 🎉');
        navigate(`/orders`);
        setLoading(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đặt hàng thất bại');
      setLoading(false);
    }
  };

  const cities = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Biên Hoà', 'Nha Trang', 'Huế', 'Buôn Ma Thuột', 'Quy Nhơn', 'Vũng Tàu', 'Khác'];

  return (
    <div>
      <Navbar />
      <div className="container page-wrapper" style={{ paddingTop: 24, paddingBottom: 48 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 24 }}>🚀 Xác nhận đơn hàng</h1>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
          {/* Shipping Form */}
          <div>
            <div className="card" style={{ padding: 28, borderRadius: 'var(--radius-xl)', marginBottom: 16 }}>
              <h2 style={{ fontWeight: 800, marginBottom: 20 }}>📍 Địa chỉ giao hàng</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Họ tên người nhận *</label>
                  <input className="form-input" value={form.fullName} onChange={(e) => setForm(f => ({...f, fullName: e.target.value}))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Số điện thoại *</label>
                  <input className="form-input" value={form.phone} onChange={(e) => setForm(f => ({...f, phone: e.target.value}))} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Địa chỉ cụ thể *</label>
                <input className="form-input" placeholder="Số nhà, đường, phường/xã, quận/huyện" value={form.address} onChange={(e) => setForm(f => ({...f, address: e.target.value}))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Tỉnh/Thành phố *</label>
                <select className="form-input form-select" value={form.city} onChange={(e) => setForm(f => ({...f, city: e.target.value}))}>
                  <option value="">-- Chọn tỉnh thành --</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Ghi chú (tuỳ chọn)</label>
                <textarea className="form-input" rows={3} placeholder="Ghi chú về đơn hàng của bạn..." value={form.note} onChange={(e) => setForm(f => ({...f, note: e.target.value}))} />
              </div>
            </div>

            <div className="card" style={{ padding: 28, borderRadius: 'var(--radius-xl)' }}>
              <h2 style={{ fontWeight: 800, marginBottom: 16 }}>💳 Phương thức thanh toán</h2>
              {[
                { key: 'cod', label: '💵 Thanh toán khi nhận hàng (COD)', desc: 'Thanh toán bằng tiền mặt khi nhận hàng' },
                { key: 'banking', label: '🏦 Chuyển khoản ngân hàng', desc: 'Chuyển khoản trước, giao hàng sau' },
                { key: 'vnpay', label: '🎯 VNPay', desc: 'Thanh toán trực tuyến qua cổng VNPay' },
              ].map(opt => (
                <label key={opt.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', border: `2px solid ${form.paymentMethod === opt.key ? 'var(--primary)' : 'var(--gray-200)'}`, borderRadius: 'var(--radius)', cursor: 'pointer', marginBottom: 10, background: form.paymentMethod === opt.key ? 'var(--primary-light)' : 'white' }}>
                  <input type="radio" name="payment" value={opt.key} checked={form.paymentMethod === opt.key} onChange={() => setForm(f => ({...f, paymentMethod: opt.key}))} style={{ marginTop: 2 }} />
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 2 }}>{opt.label}</div>
                    <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: 24, border: '1px solid var(--gray-200)', position: 'sticky', top: 90 }}>
              <h3 style={{ fontWeight: 800, marginBottom: 16 }}>📦 Đơn hàng ({items.length} sản phẩm)</h3>
              <div style={{ maxHeight: 280, overflowY: 'auto', marginBottom: 16 }}>
                {items.map(item => {
                  const b = item.book;
                  if (!b) return null;
                  return (
                    <div key={b._id} style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center' }}>
                      <img src={b.imageUrl} alt={b.title} style={{ width: 48, height: 64, objectFit: 'cover', borderRadius: 6 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{b.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>x{item.quantity}</div>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--primary)' }}>{fmt(item.price * item.quantity)}</div>
                    </div>
                  );
                })}
              </div>
              <hr className="divider" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, fontSize: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--gray-600)' }}>Tạm tính</span>
                  <span style={{ fontWeight: 600 }}>{fmt(totalPrice)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--gray-600)' }}>Vận chuyển</span>
                  <span style={{ color: shippingFee === 0 ? 'var(--success)' : '', fontWeight: 600 }}>{shippingFee === 0 ? 'Miễn phí' : fmt(shippingFee)}</span>
                </div>
                <hr className="divider" style={{ margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 900 }}>
                  <span>Tổng cộng</span>
                  <span style={{ color: 'var(--primary)' }}>{fmt(finalTotal)}</span>
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading || items.length === 0}>
                {loading ? '⏳ Đang đặt hàng...' : '✅ Đặt hàng ngay'}
              </button>
            </div>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
}
