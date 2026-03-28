import { useState } from 'react';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', address: user?.address || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('profile');

  const handleProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(form);
      toast.success('Cập nhật thành công!');
    } catch (err) {
      toast.error('Cập nhật thất bại');
    } finally { setLoading(false); }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) { toast.error('Mật khẩu xác nhận không khớp!'); return; }
    setLoading(true);
    try {
      await authAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Đổi mật khẩu thành công!');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đổi mật khẩu thất bại');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 24, paddingBottom: 48, maxWidth: 700 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 24 }}>👤 Tài Khoản Của Tôi</h1>
        {/* Avatar */}
        <div className="card" style={{ padding: 24, borderRadius: 'var(--radius-xl)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} style={{ width: 72, height: 72, borderRadius: '50%', border: '3px solid var(--primary)' }} />
          ) : (
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, color: 'white' }}>
              {user?.name[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{user?.name}</div>
            <div style={{ fontSize: 14, color: 'var(--gray-500)' }}>{user?.email}</div>
            <span className={`badge ${user?.role === 'admin' ? 'badge-red' : 'badge-green'}`} style={{ marginTop: 4 }}>
              {user?.role === 'admin' ? '⚙️ Quản trị viên' : '👤 Khách hàng'}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs" style={{ marginBottom: 20 }}>
          <button className={`tab-btn ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>📝 Thông tin cá nhân</button>
          <button className={`tab-btn ${tab === 'password' ? 'active' : ''}`} onClick={() => setTab('password')}>🔒 Đổi mật khẩu</button>
        </div>

        {tab === 'profile' && (
          <form className="card animate-fadeIn" style={{ padding: 28, borderRadius: 'var(--radius-xl)' }} onSubmit={handleProfile}>
            <div className="form-group">
              <label className="form-label">Họ và tên</label>
              <input className="form-input" value={form.name} onChange={(e) => setForm(f => ({...f, name: e.target.value}))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Số điện thoại</label>
              <input className="form-input" type="tel" placeholder="0901xxxxxx" value={form.phone} onChange={(e) => setForm(f => ({...f, phone: e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Địa chỉ</label>
              <input className="form-input" placeholder="Địa chỉ giao hàng mặc định" value={form.address} onChange={(e) => setForm(f => ({...f, address: e.target.value}))} />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? '⏳ Đang lưu...' : '💾 Lưu thay đổi'}
            </button>
          </form>
        )}

        {tab === 'password' && (
          <form className="card animate-fadeIn" style={{ padding: 28, borderRadius: 'var(--radius-xl)' }} onSubmit={handlePassword}>
            {!user?.googleId && (
              <div className="form-group">
                <label className="form-label">Mật khẩu hiện tại</label>
                <input className="form-input" type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm(f => ({...f, currentPassword: e.target.value}))} required />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Mật khẩu mới</label>
              <input className="form-input" type="password" placeholder="Tối thiểu 6 ký tự" value={pwForm.newPassword} onChange={(e) => setPwForm(f => ({...f, newPassword: e.target.value}))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Xác nhận mật khẩu mới</label>
              <input className="form-input" type="password" value={pwForm.confirm} onChange={(e) => setPwForm(f => ({...f, confirm: e.target.value}))} required />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? '⏳ Đang đổi...' : '🔒 Đổi mật khẩu'}
            </button>
          </form>
        )}
      </div>
      <Footer />
    </div>
  );
}
