import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const fmt = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

const EMPTY_BOOK = {
  title: '', author: '', description: '', price: '', originalPrice: '', discount: 0,
  imageUrl: '', category: '', type: 'book', volume: '', seriesName: '',
  publisher: '', publishYear: '', stock: 100, sold: 0, rating: 0, ratingCount: 0,
  isFlashSale: false, isBestseller: false, isTrending: false, isFeatured: false,
  language: 'Tiếng Việt', pages: '', tags: '',
};

export default function AdminBooks() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_BOOK);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [booksRes, catsRes] = await Promise.all([
      adminAPI.getBooks({ page, limit: 15, search }),
      adminAPI.getCategories(),
    ]);
    setBooks(booksRes.data.data || []);
    setPagination(booksRes.data.pagination || {});
    setCategories(catsRes.data.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [page, search]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_BOOK); setShowModal(true); };
  const openEdit = (book) => {
    setEditing(book._id);
    setForm({ ...EMPTY_BOOK, ...book, category: book.category?._id || book.category || '', tags: (book.tags || []).join(', ') });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        originalPrice: Number(form.originalPrice),
        discount: Number(form.discount),
        stock: Number(form.stock),
        sold: Number(form.sold),
        rating: Number(form.rating),
        ratingCount: Number(form.ratingCount),
        volume: form.volume ? Number(form.volume) : null,
        pages: form.pages ? Number(form.pages) : 0,
        publishYear: form.publishYear ? Number(form.publishYear) : undefined,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      };
      if (editing) await adminAPI.updateBook(editing, payload);
      else await adminAPI.createBook(payload);
      toast.success(editing ? 'Đã cập nhật sách!' : 'Đã thêm sách mới!');
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi lưu sách');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Xoá sách "${title}"?`)) return;
    try {
      await adminAPI.deleteBook(id);
      toast.success('Đã xoá sách');
      load();
    } catch { toast.error('Xoá thất bại'); }
  };

  const setF = (field, val) => setForm(f => ({ ...f, [field]: val }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900 }}>📚 Quản lý Sách</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Thêm sách mới</button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input className="form-input" style={{ maxWidth: 360 }} placeholder="🔍 Tìm sách, tác giả..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
        {loading ? <div className="spinner-wrapper"><div className="spinner" /></div> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Sách</th><th>Danh mục</th><th>Loại</th><th>Giá</th><th>Kho</th><th>Đã bán</th><th>Flags</th><th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {books.map(b => (
                  <tr key={b._id}>
                    <td>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <img src={b.imageUrl} alt={b.title} style={{ width: 36, height: 48, objectFit: 'cover', borderRadius: 4 }} onError={(e) => { e.target.src = 'https://via.placeholder.com/36x48'; }} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{b.author}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>{b.category?.name || '-'}</td>
                    <td><span className={`badge ${b.type === 'manga' ? 'badge-blue' : 'badge-green'}`}>{b.type === 'manga' ? '🎌 Manga' : '📖 Sách'}</span></td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 13 }}>{fmt(b.price)}</td>
                    <td style={{ fontWeight: 600 }}>{b.stock}</td>
                    <td>{b.sold?.toLocaleString()}</td>
                    <td style={{ fontSize: 12 }}>
                      {b.isFlashSale && '⚡'}{b.isBestseller && '🏆'}{b.isTrending && '🔥'}{b.isFeatured && '⭐'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openEdit(b)} className="btn btn-sm btn-ghost" style={{ border: '1px solid var(--gray-200)', padding: '4px 10px' }}>✏️</button>
                        <button onClick={() => handleDelete(b._id, b.title)} className="btn btn-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none', padding: '4px 10px' }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--gray-100)', fontSize: 14, color: 'var(--gray-600)' }}>
          <span>Tổng: {pagination.total} sách</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {Array.from({ length: Math.min(pagination.pages || 1, 5) }, (_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} className="page-btn" style={{ background: page === i + 1 ? 'var(--primary)' : '', color: page === i + 1 ? 'white' : '' }}>{i + 1}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box" style={{ maxWidth: 720 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editing ? '✏️ Sửa sách' : '➕ Thêm sách mới'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Tên sách *</label>
                  <input className="form-input" value={form.title} onChange={(e) => setF('title', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Tác giả *</label>
                  <input className="form-input" value={form.author} onChange={(e) => setF('author', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">NXB</label>
                  <input className="form-input" value={form.publisher} onChange={(e) => setF('publisher', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Danh mục *</label>
                  <select className="form-input form-select" value={form.category} onChange={(e) => setF('category', e.target.value)} required>
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Loại</label>
                  <select className="form-input form-select" value={form.type} onChange={(e) => setF('type', e.target.value)}>
                    <option value="book">📖 Sách</option>
                    <option value="manga">🎌 Manga</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Giá bán *</label>
                  <input className="form-input" type="number" value={form.price} onChange={(e) => setF('price', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Giá gốc *</label>
                  <input className="form-input" type="number" value={form.originalPrice} onChange={(e) => setF('originalPrice', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Giảm giá (%)</label>
                  <input className="form-input" type="number" min="0" max="100" value={form.discount} onChange={(e) => setF('discount', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tồn kho</label>
                  <input className="form-input" type="number" value={form.stock} onChange={(e) => setF('stock', e.target.value)} />
                </div>
                {form.type === 'manga' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Tập số</label>
                      <input className="form-input" type="number" value={form.volume} onChange={(e) => setF('volume', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Tên bộ truyện</label>
                      <input className="form-input" value={form.seriesName} onChange={(e) => setF('seriesName', e.target.value)} />
                    </div>
                  </>
                )}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">URL Ảnh bìa</label>
                  <input className="form-input" value={form.imageUrl} onChange={(e) => setF('imageUrl', e.target.value)} placeholder="https://..." />
                  {form.imageUrl && <img src={form.imageUrl} alt="preview" style={{ height: 80, marginTop: 8, borderRadius: 6 }} onError={(e) => e.target.style.display = 'none'} />}
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Mô tả</label>
                  <textarea className="form-input" rows={3} value={form.description} onChange={(e) => setF('description', e.target.value)} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Tags (ngăn cách bởi dấu phẩy)</label>
                  <input className="form-input" value={form.tags} onChange={(e) => setF('tags', e.target.value)} placeholder="van hoc, tinh yeu, lang man" />
                </div>
                {/* Flags */}
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  {[
                    { key: 'isFlashSale', label: '⚡ Flash Sale' },
                    { key: 'isBestseller', label: '🏆 Bán chạy' },
                    { key: 'isTrending', label: '🔥 Xu hướng' },
                    { key: 'isFeatured', label: '⭐ Nổi bật' },
                  ].map(f => (
                    <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                      <input type="checkbox" checked={!!form[f.key]} onChange={(e) => setF(f.key, e.target.checked)} />
                      {f.label}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Huỷ</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Đang lưu...' : editing ? '💾 Cập nhật' : '➕ Thêm sách'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
