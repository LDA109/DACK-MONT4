import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import Navbar from '../components/Navbar/Navbar';
import toast from 'react-hot-toast';

export default function Register() {
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error('Mật khẩu xác nhận không khớp!'); return; }
    if (form.password.length < 6) { toast.error('Mật khẩu ít nhất 6 ký tự!'); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Đăng ký thành công! Chào mừng bạn 🎉');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng ký thất bại');
    } finally { setLoading(false); }
  };

  const handleGoogle = async (credentialResponse) => {
    try {
      const data = await googleLogin(credentialResponse.credential);
      toast.success(`Đăng ký thành công! Xin chào ${data.user.name} 🎉`);
      navigate('/');
    } catch (err) {
      toast.error('Đăng ký bằng Google thất bại');
    }
  };

  return (
    <div>
      <Navbar />
      <div style={{ minHeight: 'calc(100vh - 110px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8f5e9 0%, #fff 50%, #ffebee 100%)', padding: '40px 20px' }}>
        <div className="card animate-fadeInUp" style={{ width: '100%', maxWidth: 460, padding: '40px 36px', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
            <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>Tạo tài khoản</h1>
            <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>Tham gia BookStore ngay hôm nay!</p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <GoogleLogin onSuccess={handleGoogle} onError={() => toast.error('Google signup thất bại')} width="100%" text="signup_with" locale="vi" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--gray-200)' }} />
            <span style={{ fontSize: 13, color: 'var(--gray-400)', fontWeight: 500 }}>hoặc đăng ký với email</span>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--gray-200)' }} />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">👤 Họ và tên</label>
              <input className="form-input" type="text" placeholder="Nguyễn Văn A"
                value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">📧 Email</label>
              <input className="form-input" type="email" placeholder="your@email.com"
                value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">🔒 Mật khẩu</label>
              <input className="form-input" type="password" placeholder="Tối thiểu 6 ký tự"
                value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">🔒 Xác nhận mật khẩu</label>
              <input className="form-input" type="password" placeholder="Nhập lại mật khẩu"
                value={form.confirm} onChange={(e) => setForm(f => ({ ...f, confirm: e.target.value }))} required />
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? '⏳ Đang đăng ký...' : '🚀 Đăng ký'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--gray-500)' }}>
            Đã có tài khoản?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
