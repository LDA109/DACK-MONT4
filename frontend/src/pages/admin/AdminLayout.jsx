import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminLayout.css';

const NAV_ITEMS = [
  { to: '/admin', label: '📊 Tổng quan', end: true },
  { to: '/admin/books', label: '📚 Quản lý Sách' },
  { to: '/admin/categories', label: '🗂️ Danh mục' },
  { to: '/admin/orders', label: '📦 Đơn hàng' },
  { to: '/admin/coupons', label: '🎟️ Quản lý Coupon' },
  { to: '/admin/users', label: '👥 Người dùng' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (to, end) => end ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <div className="admin-wrapper">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <Link to="/" style={{ fontSize: 22, fontWeight: 900, color: 'white', textDecoration: 'none' }}>
            📚 Book<span style={{ color: 'var(--gold)' }}>Store</span>
          </Link>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 }}>Admin Panel</div>
        </div>
        <nav className="admin-nav">
          {NAV_ITEMS.map(item => (
            <Link key={item.to} to={item.to}
              className={`admin-nav-item ${isActive(item.to, item.end) ? 'active' : ''}`}
            >{item.label}</Link>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {user?.avatar
              ? <img src={user.avatar} alt="" style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid rgba(255,255,255,.3)' }} />
              : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'white' }}>{user?.name[0]?.toUpperCase()}</div>
            }
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)' }}>Admin</div>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/'); }} style={{ marginTop: 12, width: '100%', padding: '8px', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', borderRadius: 'var(--radius)', color: 'rgba(255,255,255,.8)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            🚪 Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
