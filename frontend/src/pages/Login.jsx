import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import Navbar from '../components/Navbar/Navbar';
import toast from 'react-hot-toast';

export default function Login() {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Đăng nhập thành công!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng nhập thất bại');
    } finally { setLoading(false); }
  };

  const handleGoogle = async (credentialResponse) => {
    try {
      const data = await googleLogin(credentialResponse.credential);
      toast.success(`Xin chào ${data.user.name}! 👋`);
      if (data.user.role === 'admin') navigate('/admin');
      else navigate('/');
    } catch (err) {
      toast.error('Đăng nhập Google thất bại');
    }
  };

  return (
    <div>
      <Navbar />
      <div style={{ minHeight: 'calc(100vh - 110px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #ffebee 0%, #fff 50%, #e3f2fd 100%)', padding: '40px 20px' }}>
        <div className="card animate-fadeInUp" style={{ width: '100%', maxWidth: 440, padding: '40px 36px', borderRadius: 'var(--radius-xl)' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>📚</div>
            <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>Đăng nhập</h1>
            <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>Chào mừng trở lại BookStore!</p>
          </div>

          {/* Google */}
          <div style={{ marginBottom: 20 }}>
            <GoogleLogin
              onSuccess={handleGoogle}
              onError={() => toast.error('Google login thất bại')}
              width="100%"
              text="signin_with"
              locale="vi"
            />
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--gray-200)' }} />
            <span style={{ fontSize: 13, color: 'var(--gray-400)', fontWeight: 500 }}>hoặc</span>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--gray-200)' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">📧 Email</label>
              <input className="form-input" type="email" placeholder="your@email.com"
                value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">🔒 Mật khẩu</label>
              <input className="form-input" type="password" placeholder="••••••••"
                value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} required />
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? '⏳ Đang đăng nhập...' : '🚀 Đăng nhập'}
            </button>
          </form>



          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--gray-500)' }}>
            Chưa có tài khoản?{' '}
            <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 700 }}>Đăng ký ngay</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
