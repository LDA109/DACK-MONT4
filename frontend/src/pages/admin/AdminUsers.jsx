import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    const res = await adminAPI.getUsers({ page, limit: 15, search });
    setUsers(res.data.data || []);
    setPagination(res.data.pagination || {});
    setLoading(false);
  };

  useEffect(() => { load(); }, [page, search]);

  const updateRole = async (id, role) => {
    try {
      await adminAPI.updateUserRole(id, role);
      setUsers(prev => prev.map(u => u._id === id ? { ...u, role } : u));
      toast.success('Đã cập nhật quyền!');
    } catch { toast.error('Cập nhật thất bại'); }
  };

  const toggleUser = async (id) => {
    try {
      const res = await adminAPI.toggleUser(id);
      setUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: res.data.data.isActive } : u));
      toast.success(res.data.message);
    } catch { toast.error('Thao tác thất bại'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900 }}>👥 Quản lý Người dùng</h1>
        <span style={{ color: 'var(--gray-500)', fontSize: 14 }}>Tổng: {pagination.total || 0} user</span>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input className="form-input" style={{ maxWidth: 360 }} placeholder="🔍 Tìm tên, email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
        {loading ? <div className="spinner-wrapper"><div className="spinner" /></div> : (
          <table className="admin-table">
            <thead>
              <tr><th>Người dùng</th><th>Email</th><th>Đăng ký</th><th>Role</th><th>Trạng thái</th><th>Thao tác</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {u.avatar
                        ? <img src={u.avatar} alt={u.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                        : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800 }}>{u.name[0]?.toUpperCase()}</div>
                      }
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{u.name}</div>
                        {u.googleId && <span style={{ fontSize: 11, color: 'var(--gray-500)' }}>🔵 Google</span>}
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--gray-600)' }}>{u.email}</td>
                  <td style={{ fontSize: 12, color: 'var(--gray-500)' }}>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <select className="form-input form-select" style={{ padding: '4px 28px 4px 8px', fontSize: 12, height: 32, width: 120 }}
                      value={u.role} onChange={(e) => updateRole(u._id, e.target.value)}>
                      <option value="user">👤 User</option>
                      <option value="admin">⚙️ Admin</option>
                    </select>
                  </td>
                  <td><span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>{u.isActive ? '✅ Hoạt động' : '🚫 Bị khóa'}</span></td>
                  <td>
                    <button onClick={() => toggleUser(u._id)} className="btn btn-sm"
                      style={{ background: u.isActive ? 'var(--primary-light)' : 'var(--success-light)', color: u.isActive ? 'var(--primary)' : 'var(--success)', border: 'none', fontSize: 12 }}>
                      {u.isActive ? '🔒 Khóa' : '🔓 Mở khóa'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
          {Array.from({ length: Math.min(pagination.pages || 1, 5) }, (_, i) => (
            <button key={i} onClick={() => setPage(i + 1)} className="page-btn" style={{ background: page === i + 1 ? 'var(--primary)' : '', color: page === i + 1 ? 'white' : '' }}>{i + 1}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
