import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const EMPTY_CAT = { name: '', slug: '', icon: '📚', description: '', order: 0 };

export default function AdminCategories() {
  const [cats, setCats] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_CAT);
  const [saving, setSaving] = useState(false);

  const load = () => adminAPI.getCategories().then(r => setCats(r.data.data || []));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY_CAT); setShowModal(true); };
  const openEdit = (c) => { setEditing(c._id); setForm({ ...EMPTY_CAT, ...c }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await adminAPI.updateCategory(editing, form);
      else await adminAPI.createCategory(form);
      toast.success(editing ? 'Đã cập nhật!' : 'Đã thêm danh mục!');
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi lưu danh mục');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Xoá danh mục "${name}"?`)) return;
    try { await adminAPI.deleteCategory(id); toast.success('Đã xoá'); load(); }
    catch { toast.error('Xoá thất bại'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900 }}>🗂️ Quản lý Danh mục</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Thêm danh mục</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
        {cats.map(c => (
          <div key={c._id} className="card" style={{ padding: 20, borderRadius: 'var(--radius-lg)' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>{c.icon}</div>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>{c.name}</div>
            <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 4 }}>/{c.slug}</div>
            <div style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 12, minHeight: 36 }}>{c.description}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => openEdit(c)} className="btn btn-sm btn-ghost" style={{ flex: 1, border: '1px solid var(--gray-200)' }}>✏️ Sửa</button>
              <button onClick={() => handleDelete(c._id, c.name)} className="btn btn-sm" style={{ flex: 1, background: 'var(--primary-light)', color: 'var(--primary)', border: 'none' }}>🗑️ Xoá</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editing ? '✏️ Sửa danh mục' : '➕ Thêm danh mục'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Tên danh mục *</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm(f => ({...f, name: e.target.value}))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Slug (URL) *</label>
                <input className="form-input" value={form.slug} onChange={(e) => setForm(f => ({...f, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')}))} required placeholder="van-hoc, manga, ..." />
              </div>
              <div className="form-group">
                <label className="form-label">Icon (emoji)</label>
                <input className="form-input" value={form.icon} onChange={(e) => setForm(f => ({...f, icon: e.target.value}))} maxLength={4} />
              </div>
              <div className="form-group">
                <label className="form-label">Mô tả</label>
                <input className="form-input" value={form.description} onChange={(e) => setForm(f => ({...f, description: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Thứ tự hiển thị</label>
                <input className="form-input" type="number" value={form.order} onChange={(e) => setForm(f => ({...f, order: Number(e.target.value)}))} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Huỷ</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Đang lưu...' : editing ? '💾 Cập nhật' : '➕ Thêm'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
