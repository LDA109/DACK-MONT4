import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_MAP = { pending: { label: 'Chờ xử lý', cls: 'badge-orange' }, confirmed: { label: 'Đã xác nhận', cls: 'badge-blue' }, shipping: { label: 'Đang giao', cls: 'badge-blue' }, delivered: { label: 'Đã giao', cls: 'badge-green' }, cancelled: { label: 'Đã huỷ', cls: 'badge-red' } };
const fmt = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const load = async () => {
    setLoading(true);
    const res = await adminAPI.getOrders({ page, limit: 15, status: statusFilter || undefined });
    setOrders(res.data.data || []);
    setPagination(res.data.pagination || {});
    setLoading(false);
  };

  useEffect(() => { load(); }, [page, statusFilter]);

  const updateStatus = async (id, status) => {
    try {
      await adminAPI.updateOrderStatus(id, status);
      setOrders(prev => prev.map(o => o._id === id ? { ...o, status } : o));
      toast.success('Cập nhật trạng thái thành công!');
    } catch { toast.error('Cập nhật thất bại'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900 }}>📦 Quản lý Đơn hàng</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {['', 'pending', 'confirmed', 'shipping', 'delivered', 'cancelled'].map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`sort-btn ${statusFilter === s ? 'active' : ''}`} style={{ fontSize: 12 }}>
              {s ? STATUS_MAP[s]?.label : '🗂️ Tất cả'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
        {loading ? <div className="spinner-wrapper"><div className="spinner" /></div> : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Thanh toán</th>
                <th>Tổng cộng</th>
                <th>Ngày đặt</th>
                <th>Trạng thái Đơn</th>
                <th>Cập nhật</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => {
                const st = STATUS_MAP[o.status] || STATUS_MAP.pending;
                return (
                  <tr key={o._id}>
                    <td style={{ fontWeight: 700, fontSize: 13 }}>#{o.orderCode}</td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{o.user?.name || 'Guest'}</div>
                      <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{o.user?.email}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                        {o.paymentMethod === 'vnpay' ? '🎯 VNPay' : o.paymentMethod === 'cod' ? '💵 COD' : '🏦 Banking'}
                      </div>
                      <span className={`badge ${o.paymentStatus === 'paid' ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 10, padding: '2px 8px' }}>
                        {o.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thu tiền'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 800, color: 'var(--primary)' }}>{fmt(o.finalTotal)}</td>
                    <td style={{ fontSize: 12, color: 'var(--gray-500)' }}>{new Date(o.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                    <td>
                      <select className="form-input form-select" style={{ padding: '4px 28px 4px 8px', fontSize: 12, height: 32, minWidth: 120 }}
                        value={o.status} onChange={(e) => updateStatus(o._id, e.target.value)}>
                        {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--gray-100)', fontSize: 14, color: 'var(--gray-500)' }}>
          <span>Tổng: {pagination.total} đơn hàng</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {Array.from({ length: Math.min(pagination.pages || 1, 5) }, (_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} className="page-btn" style={{ background: page === i + 1 ? 'var(--primary)' : '', color: page === i + 1 ? 'white' : '' }}>{i + 1}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
