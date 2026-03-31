import { useState, useEffect } from 'react';
import { couponAPI } from '../../services/api';
import toast from 'react-hot-toast';

const EMPTY_COUPON = {
  code: '',
  discountType: 'percentage',
  discountValue: 0,
  minOrderValue: 0,
  maxDiscountAmount: 0,
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  usageLimit: 100,
  isActive: true,
  description: ''
};

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_COUPON);
  const [loading, setLoading] = useState(false);

  const loadCoupons = async () => {
    try {
      const res = await couponAPI.getCoupons();
      setCoupons(res.data.data || []);
    } catch (err) {
      toast.error('Không thể tải danh sách mã giảm giá');
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleOpenCreate = () => {
    setForm(EMPTY_COUPON);
    setEditingId(null);
    setShowModal(true);
  };

  const handleOpenEdit = (c) => {
    setForm({
      ...c,
      startDate: new Date(c.startDate).toISOString().split('T')[0],
      endDate: new Date(c.endDate).toISOString().split('T')[0],
    });
    setEditingId(c._id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await couponAPI.updateCoupon(editingId, form);
        toast.success('Đã cập nhật mã giảm giá');
      } else {
        await couponAPI.createCoupon(form);
        toast.success('Đã thêm mã giảm giá mới');
      }
      setShowModal(false);
      loadCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi xử lý');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa mã này?')) return;
    try {
      await couponAPI.deleteCoupon(id);
      toast.success('Đã xóa mã');
      loadCoupons();
    } catch (err) {
      toast.error('Xóa thất bại');
    }
  };

  const toggleActive = async (c) => {
    try {
      await couponAPI.updateCoupon(c._id, { isActive: !c.isActive });
      toast.success(c.isActive ? 'Đã vô hiệu hóa mã' : 'Đã kích hoạt mã');
      loadCoupons();
    } catch (err) {
      toast.error('Lỗi cập nhật trạng thái');
    }
  };

  return (
    <div className="admin-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900 }}>🎟️ Quản lý Mã giảm giá</h1>
        <button className="btn btn-primary" onClick={handleOpenCreate}>+ Tạo mã mới</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mã Code</th>
              <th>Loại</th>
              <th>Giá trị</th>
              <th>Đơn tối thiểu</th>
              <th>Thời gian</th>
              <th>Sử dụng</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map(c => {
              const isExpired = new Date() > new Date(c.endDate);
              const isLimitReached = c.usageLimit && c.usedCount >= c.usageLimit;
              
              return (
                <tr key={c._id}>
                  <td><strong style={{ color: 'var(--primary)', letterSpacing: 0.5 }}>{c.code}</strong></td>
                  <td>{c.discountType === 'percentage' ? '%' : 'Cố định'}</td>
                  <td>{c.discountType === 'percentage' ? `${c.discountValue}%` : `${c.discountValue.toLocaleString()}đ`}</td>
                  <td>{c.minOrderValue.toLocaleString()}đ</td>
                  <td style={{ fontSize: 12 }}>
                    {new Date(c.startDate).toLocaleDateString('vi-VN')} - {new Date(c.endDate).toLocaleDateString('vi-VN')}
                  </td>
                  <td>{c.usedCount} / {c.usageLimit || '∞'}</td>
                  <td>
                    <span className={`badge ${c.isActive && !isExpired && !isLimitReached ? 'badge-success' : 'badge-danger'}`}>
                      {isExpired ? 'Hết hạn' : isLimitReached ? 'Hết lượt' : c.isActive ? 'Đang chạy' : 'Đã tắt'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm btn-ghost" onClick={() => handleOpenEdit(c)} title="Sửa">✏️</button>
                      <button className="btn btn-sm btn-ghost" onClick={() => toggleActive(c)} title={c.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}>
                        {c.isActive ? '🚫' : '✅'}
                      </button>
                      <button className="btn btn-sm btn-ghost" onClick={() => handleDelete(c._id)} style={{ color: 'var(--danger)' }} title="Xóa">🗑️</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {coupons.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: 40, color: 'var(--gray-500)' }}>Chưa có mã giảm giá nào</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingId ? '✏️ Cập nhật mã' : '➕ Tạo mã giảm giá mới'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Mã giảm giá (Code) *</label>
                <input 
                  className="form-input" 
                  value={form.code} 
                  onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} 
                  required 
                  placeholder="Ví dụ: GIAM50K, AO_MOI_20"
                  disabled={!!editingId}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Loại giảm giá *</label>
                  <select className="form-input" value={form.discountType} onChange={e => setForm({...form, discountType: e.target.value})}>
                    <option value="percentage">Phần trăm (%)</option>
                    <option value="fixed">Số tiền mặt (đ)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Giá trị giảm *</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      className="form-input" 
                      type="number" 
                      value={form.discountValue} 
                      onChange={e => setForm({...form, discountValue: Number(e.target.value)})} 
                      required 
                      style={{ paddingRight: '45px' }}
                    />
                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', fontWeight: 600 }}>
                      {form.discountType === 'percentage' ? '%' : 'đ'}
                    </span>
                  </div>
                </div>
              </div>

              {form.discountType === 'percentage' && (
                <div className="form-group">
                  <label className="form-label">Số tiền giảm tối đa (VNĐ)</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      className="form-input" 
                      type="number" 
                      value={form.maxDiscountAmount} 
                      onChange={e => setForm({...form, maxDiscountAmount: Number(e.target.value)})} 
                      placeholder="Để 0 nếu không giới hạn"
                      style={{ paddingRight: '45px' }}
                    />
                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', fontSize: 13 }}>VNĐ</span>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Đơn hàng tối thiểu để áp dụng *</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    className="form-input" 
                    type="number" 
                    value={form.minOrderValue} 
                    onChange={e => setForm({...form, minOrderValue: Number(e.target.value)})} 
                    required 
                    style={{ paddingRight: '45px' }}
                  />
                  <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', fontSize: 13 }}>VNĐ</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Ngày bắt đầu *</label>
                  <input 
                    className="form-input" 
                    type="date" 
                    value={form.startDate} 
                    onChange={e => setForm({...form, startDate: e.target.value})} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Ngày kết thúc *</label>
                  <input 
                    className="form-input" 
                    type="date" 
                    value={form.endDate} 
                    onChange={e => setForm({...form, endDate: e.target.value})} 
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Tổng số lượt mã có thể sử dụng (0 = vô hạn)</label>
                <input 
                  className="form-input" 
                  type="number" 
                  value={form.usageLimit} 
                  onChange={e => setForm({...form, usageLimit: Number(e.target.value)})} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mô tả ngắn</label>
                <textarea 
                  className="form-input" 
                  rows={2} 
                  value={form.description} 
                  onChange={e => setForm({...form, description: e.target.value})}
                  placeholder="Ví dụ: Giảm 10% tối đa 50k cho đơn từ 200k"
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Huỷ</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Đang lưu...' : editingId ? '💾 Cập nhật' : '➕ Tạo mã'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
