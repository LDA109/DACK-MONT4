import { useState, useEffect } from 'react';
import { inventoryAPI, bookAPI } from '../../services/api';
import toast from 'react-hot-toast';

const fmt = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

export default function AdminInventory() {
  const [inventory, setInventory] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    bookId: '',
    availableStock: 0,
    reservedStock: 0,
    restockThreshold: 20,
    warehouseLocation: ''
  });
  const [adjustForm, setAdjustForm] = useState({
    action: 'sold',
    quantity: 0,
    reason: ''
  });
  const [showAdjustModal, setShowAdjustModal] = useState(null);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const res = await inventoryAPI.getInventory();
      const inventoryData = Array.isArray(res.data) ? res.data : res.data.data || [];
      
      // Populate book details
      const populated = inventoryData.map(item => ({
        ...item,
        bookTitle: item.bookId?.title || item.book?.title || 'N/A',
        bookPrice: item.bookId?.price || item.book?.price || 0,
      }));
      
      setInventory(populated);
    } catch (err) {
      toast.error('Không thể tải kho hàng');
    } finally {
      setLoading(false);
    }
  };

  const loadBooks = async () => {
    try {
      const res = await bookAPI.getBooks({ limit: 200 });
      setBooks(res.data.books || []);
    } catch (err) {
      console.error('Error loading books:', err);
    }
  };

  useEffect(() => {
    loadInventory();
    loadBooks();
  }, []);

  const handleCreate = () => {
    setForm({
      bookId: '',
      availableStock: 0,
      reservedStock: 0,
      restockThreshold: 20,
      warehouseLocation: ''
    });
    setEditingId(null);
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setForm({
      bookId: item.bookId._id || item.bookId,
      availableStock: item.availableStock,
      reservedStock: item.reservedStock,
      restockThreshold: item.restockThreshold,
      warehouseLocation: item.warehouseLocation
    });
    setEditingId(item._id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await inventoryAPI.updateInventory(editingId, form);
        toast.success('Cập nhật kho thành công');
      } else {
        await inventoryAPI.createInventory(form);
        toast.success('Thêm kho thành công');
      }
      setShowModal(false);
      loadInventory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi xử lý');
    }
  };

  const handleAdjustStock = async (id) => {
    if (adjustForm.quantity <= 0) {
      toast.error('Nhập số lượng > 0');
      return;
    }
    try {
      await inventoryAPI.adjustStock(id, adjustForm);
      toast.success(`Điều chỉnh kho thành công (${adjustForm.action})`);
      setShowAdjustModal(null);
      setAdjustForm({ action: 'sold', quantity: 0, reason: '' });
      loadInventory();
    } catch (err) {
      toast.error('Điều chỉnh thất bại');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xác nhận xóa kho này?')) return;
    try {
      await inventoryAPI.deleteInventory(id);
      toast.success('Xóa thành công');
      loadInventory();
    } catch (err) {
      toast.error('Xóa thất bại');
    }
  };

  const handleSeedInventory = async () => {
    if (!window.confirm('Tự động tạo kho cho tất cả sản phẩm chưa có kho?\n\nSố lượng sẽ dựa trên stock của sản phẩm (mặc định 100)')) return;
    try {
      const res = await inventoryAPI.seedInventory();
      toast.success(`✅ Đã tạo ${res.data.created} kho hàng!`);
      loadInventory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Tạo kho thất bại');
    }
  };

  if (loading) return <div>⏳ Đang tải...</div>;

  return (
    <div className="admin-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900 }}>📦 Quản lý Kho hàng</h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-sm" style={{ background: 'var(--success)' }} onClick={handleSeedInventory}>
            🌱 Tự động tạo kho
          </button>
          <button className="btn btn-primary" onClick={handleCreate}>+ Thêm kho</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card">
          <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 4 }}>Tổng sản phẩm</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--primary)' }}>
            {inventory.reduce((s, i) => s + (i.availableStock || 0), 0)}
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 4 }}>Đã đặt trước</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--gold)' }}>
            {inventory.reduce((s, i) => s + (i.reservedStock || 0), 0)}
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 4 }}>Sản phẩm</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--success)' }}>
            {inventory.length}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflowX: 'auto' }}>
        {inventory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--gray-500)' }}>
            Chưa có kho hàng nào
          </div>
        ) : (
          <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--gray-200)' }}>
                <th style={{ padding: 12, textAlign: 'left', fontWeight: 700 }}>Sản phẩm</th>
                <th style={{ padding: 12, textAlign: 'center', fontWeight: 700 }}>Có sẵn</th>
                <th style={{ padding: 12, textAlign: 'center', fontWeight: 700 }}>Đặt trước</th>
                <th style={{ padding: 12, textAlign: 'center', fontWeight: 700 }}>Ngưỡng nhập</th>
                <th style={{ padding: 12, textAlign: 'left', fontWeight: 700 }}>Vị trí</th>
                <th style={{ padding: 12, textAlign: 'center', fontWeight: 700 }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map(item => {
                const needsRestock = item.availableStock <= item.restockThreshold;
                return (
                  <tr key={item._id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                    <td style={{ padding: 12 }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{item.bookTitle}</div>
                        <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{fmt(item.bookPrice)}</div>
                      </div>
                    </td>
                    <td style={{ padding: 12, textAlign: 'center' }}>
                      <span style={{ fontWeight: 600, color: needsRestock ? 'var(--error)' : 'var(--success)' }}>
                        {item.availableStock}
                        {needsRestock && ' ⚠️'}
                      </span>
                    </td>
                    <td style={{ padding: 12, textAlign: 'center', color: 'var(--gold)', fontWeight: 600 }}>
                      {item.reservedStock}
                    </td>
                    <td style={{ padding: 12, textAlign: 'center', color: 'var(--gray-600)' }}>
                      {item.restockThreshold}
                    </td>
                    <td style={{ padding: 12, color: 'var(--gray-700)' }}>
                      {item.warehouseLocation || '-'}
                    </td>
                    <td style={{ padding: 12, textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => { setShowAdjustModal(item._id); setAdjustForm({ action: 'sold', quantity: 0, reason: '' }); }}
                        style={{ 
                          padding: '4px 8px', 
                          background: 'var(--primary)', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: 4, 
                          cursor: 'pointer',
                          fontSize: 12,
                          marginRight: 4
                        }}
                      >
                        ⚙️ Điều chỉnh
                      </button>
                      <button
                        onClick={() => handleEdit(item)}
                        style={{ 
                          padding: '4px 8px', 
                          background: 'var(--gold)', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: 4, 
                          cursor: 'pointer',
                          fontSize: 12,
                          marginRight: 4
                        }}
                      >
                        ✏️ Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        style={{ 
                          padding: '4px 8px', 
                          background: 'var(--error)', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: 4, 
                          cursor: 'pointer',
                          fontSize: 12
                        }}
                      >
                        ✕ Xóa
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '90%', maxWidth: 500, maxHeight: '90vh', overflow: 'auto' }}>
            <h2 style={{ marginBottom: 16 }}>{editingId ? '✏️ Sửa kho' : '➕ Thêm kho mới'}</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Sản phẩm *</label>
                <select
                  value={form.bookId}
                  onChange={(e) => setForm({ ...form, bookId: e.target.value })}
                  required
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--gray-300)' }}
                >
                  <option value="">-- Chọn sản phẩm --</option>
                  {books.map(b => (
                    <option key={b._id} value={b._id}>{b.title} ({fmt(b.price)})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Có sẵn *</label>
                  <input
                    type="number"
                    value={form.availableStock}
                    onChange={(e) => setForm({ ...form, availableStock: parseInt(e.target.value) || 0 })}
                    required
                    min="0"
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--gray-300)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Đặt trước</label>
                  <input
                    type="number"
                    value={form.reservedStock}
                    onChange={(e) => setForm({ ...form, reservedStock: parseInt(e.target.value) || 0 })}
                    min="0"
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--gray-300)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Ngưỡng nhập</label>
                  <input
                    type="number"
                    value={form.restockThreshold}
                    onChange={(e) => setForm({ ...form, restockThreshold: parseInt(e.target.value) || 0 })}
                    min="0"
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--gray-300)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Vị trí kho</label>
                  <input
                    type="text"
                    value={form.warehouseLocation}
                    placeholder="A-101"
                    onChange={(e) => setForm({ ...form, warehouseLocation: e.target.value })}
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--gray-300)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn">Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {showAdjustModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '90%', maxWidth: 400 }}>
            <h2 style={{ marginBottom: 16 }}>⚙️ Điều chỉnh kho</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleAdjustStock(showAdjustModal); }}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Hành động</label>
                <select
                  value={adjustForm.action}
                  onChange={(e) => setAdjustForm({ ...adjustForm, action: e.target.value })}
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--gray-300)' }}
                >
                  <option value="sold">📦 Bán hàng (giảm kho)</option>
                  <option value="restock">📥 Nhập kho (tăng kho)</option>
                  <option value="reserved">🔒 Đặt trước (tạm giữ)</option>
                  <option value="returned">↩️ Trả hàng (cộng lại)</option>
                  <option value="adjustment">🔧 Điều chỉnh khác</option>
                </select>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Số lượng *</label>
                <input
                  type="number"
                  value={adjustForm.quantity}
                  onChange={(e) => setAdjustForm({ ...adjustForm, quantity: parseInt(e.target.value) || 0 })}
                  required
                  min="1"
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--gray-300)' }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Lý do</label>
                <textarea
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  placeholder="Ghi chú lý do..."
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--gray-300)', minHeight: 80 }}
                />
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAdjustModal(null)} className="btn">Hủy</button>
                <button type="submit" className="btn btn-primary">Điều chỉnh</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
