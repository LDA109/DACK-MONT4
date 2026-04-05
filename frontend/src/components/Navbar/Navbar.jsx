import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import NotificationBell from '../NotificationBell/NotificationBell';
import './Navbar.css';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { cart } = useCart();
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const dropRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropdownOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/books?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">📚</span>
          <span>Book<span className="logo-accent">Store</span></span>
        </Link>

        {/* Search */}
        <form className="navbar-search" onSubmit={handleSearch}>
          <div className="search-bar">
            <input
              type="text" value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm sách, tác giả, thể loại..."
            />
            <button type="submit">🔍 Tìm</button>
          </div>
        </form>

        {/* Actions */}
        <div className="navbar-actions">
          {/* Notifications */}
          <NotificationBell />
          
          {/* Cart */}
          <Link to="/cart" className="nav-icon-btn">
            <span className="icon">🛒</span>
            {cart?.totalItems > 0 && (
              <span className="cart-badge">{cart.totalItems}</span>
            )}
          </Link>

          {/* User */}
          {user ? (
            <div className="user-dropdown" ref={dropRef}>
              <button className="user-avatar-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="user-avatar" />
                ) : (
                  <div className="user-avatar user-avatar-placeholder">
                    {user.name[0]?.toUpperCase()}
                  </div>
                )}
                <span className="user-name">{user.name.split(' ').slice(-1)[0]}</span>
                <span>▾</span>
              </button>
              {dropdownOpen && (
                <div className="dropdown-menu animate-fadeIn">
                  <div className="dropdown-header">
                    <div className="dropdown-user-name">{user.name}</div>
                    <div className="dropdown-user-email">{user.email}</div>
                  </div>
                  <div className="dropdown-divider" />
                  {isAdmin && (
                    <Link to="/admin" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                      ⚙️ Quản trị Admin
                    </Link>
                  )}
                  <Link to="/orders" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    📦 Đơn hàng của tôi
                  </Link>
                  <Link to="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    👤 Thông tin tài khoản
                  </Link>
                  <Link to="/wishlist" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    ❤️ Danh sách yêu thích
                  </Link>
                  <Link to="/search-history" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    🔍 Lịch sử tìm kiếm
                  </Link>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item text-danger" onClick={() => { logout(); setDropdownOpen(false); }}>
                    🚪 Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-outline btn-sm">Đăng nhập</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Đăng ký</Link>
            </div>
          )}
        </div>
      </div>

      {/* Sub nav */}
      <div className="subnav">
        <div className="container subnav-inner">
          <Link to="/books" className="subnav-link">📚 Tất cả sách</Link>
          <Link to="/books?isFlashSale=true" className="subnav-link flash">⚡ Flash Sale</Link>
          <Link to="/books?isBestseller=true" className="subnav-link">🏆 Bán chạy</Link>
          <Link to="/books?type=manga" className="subnav-link">🎌 Manga</Link>
          <Link to="/books?isTrending=true" className="subnav-link">🔥 Xu hướng</Link>
          <Link to="/category/van-hoc" className="subnav-link">📖 Văn học</Link>
          <Link to="/category/tam-ly-ky-nang" className="subnav-link">🧠 Kỹ năng</Link>
          <Link to="/category/kinh-te" className="subnav-link">💼 Kinh tế</Link>
          <Link to="/category/thieu-nhi" className="subnav-link">🧒 Thiếu nhi</Link>
        </div>
      </div>
    </nav>
  );
}
