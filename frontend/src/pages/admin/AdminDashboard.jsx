import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

const fmt = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

const STATUS_MAP = { pending: 'Chờ xử lý', confirmed: 'Đã xác nhận', shipping: 'Đang giao', delivered: 'Đã giao', cancelled: 'Đã huỷ' };

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getStats().then(r => { setStats(r.data.data); setLoading(false); });
  }, []);

  if (loading) return <div className="spinner-wrapper"><div className="spinner" /></div>;

  const cards = [
    { icon: '📚', label: 'Tổng sách', value: stats.totalBooks, color: '#e3f2fd', accent: '#1565c0' },
    { icon: '📦', label: 'Đơn hàng', value: stats.totalOrders, color: '#fff3e0', accent: '#f57f17' },
    { icon: '👥', label: 'Người dùng', value: stats.totalUsers, color: '#e8f5e9', accent: '#2e7d32' },
    { icon: '💰', label: 'Doanh thu', value: fmt(stats.revenue), color: '#ffebee', accent: '#e53935', isLarge: true },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 24 }}>📊 Tổng quan</h1>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {cards.map((c, i) => (
          <div key={i} style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '20px', border: '1px solid var(--gray-200)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -10, right: -10, fontSize: 72, opacity: .1 }}>{c.icon}</div>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{c.icon}</div>
            <div style={{ color: 'var(--gray-600)', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: c.isLarge ? 18 : 28, fontWeight: 900, color: c.accent }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Recent Orders */}
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 20, border: '1px solid var(--gray-200)' }}>
          <h3 style={{ fontWeight: 800, marginBottom: 16 }}>📦 Đơn hàng gần đây</h3>
          {stats.recentOrders.map(o => (
            <div key={o._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>#{o.orderCode}</div>
                <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{o.user?.name || 'Guest'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{fmt(o.finalTotal)}</div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{STATUS_MAP[o.status]}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Order by Status */}
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 20, border: '1px solid var(--gray-200)' }}>
          <h3 style={{ fontWeight: 800, marginBottom: 16 }}>📊 Trạng thái đơn hàng</h3>
          {stats.ordersByStatus.map(s => (
            <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--gray-100)' }}>
              <span style={{ fontSize: 14 }}>{STATUS_MAP[s._id] || s._id}</span>
              <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--primary)' }}>{s.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
