import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { userPreferencesAPI } from '../services/api';
import './UserPreferences.css';

export default function UserPreferencesPage() {
  const { user } = useAuth();
  const { changeTheme } = useTheme();
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    fetchPreferences();
  }, [user]);

  const fetchPreferences = async () => {
    try {
      const res = await userPreferencesAPI.getPreferences();
      setPrefs(res.data.data);
      // Apply theme từ DB
      if (res.data.data.theme) {
        changeTheme(res.data.data.theme);
      }
    } catch (err) {
      console.error('Lỗi lấy cài đặt:', err);
      setError('Không thể tải cài đặt');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setPrefs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEmailNotificationChange = (key, value) => {
    setPrefs(prev => ({
      ...prev,
      emailNotifications: {
        ...prev.emailNotifications,
        [key]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      setError('');
      await userPreferencesAPI.updatePreferences({
        theme: prefs.theme,
        language: prefs.language,
        currency: prefs.currency,
        emailNotifications: prefs.emailNotifications
      });
      
      // Apply theme ngay lập tức
      if (prefs.theme === 'dark' || prefs.theme === 'light') {
        changeTheme(prefs.theme);
      }
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Lỗi lưu cài đặt:', err);
      setError('Lỗi lưu cài đặt: ' + (err.response?.data?.message || err.message));
    }
  };

  if (!user) {
    return <div className="preferences-page"><div className="preferences-container"><p>Vui lòng đăng nhập</p></div></div>;
  }

  if (loading) {
    return <div className="preferences-page"><div className="preferences-container"><p>💫 Đang tải...</p></div></div>;
  }

  if (!prefs) {
    return <div className="preferences-page"><div className="preferences-container"><p>⚠️ Không thể tải cài đặt</p></div></div>;
  }

  return (
    <div className="preferences-page">
      <div className="preferences-container">
        <div className="preferences-header">
          <h1>⚙️ Cài đặt</h1>
          <p>Quản lý tùy chọn cá nhân của bạn</p>
        </div>

        {/* Giao diện */}
        <div className="preferences-section">
          <h2 className="section-title">🎨 Giao diện</h2>
          
          <div className="preference-item">
            <div className="preference-label">
              <label>Chủ đề</label>
              <p>Chọn chế độ sáng hoặc tối</p>
            </div>
            <div className="preference-control">
              <select 
                value={prefs.theme} 
                onChange={(e) => handleChange('theme', e.target.value)}
              >
                <option value="light">☀️ Sáng</option>
                <option value="dark">🌙 Tối</option>
                <option value="auto">🔄 Tự động</option>
              </select>
            </div>
          </div>

          <div className="preference-item">
            <div className="preference-label">
              <label>Ngôn ngữ</label>
              <p>Chọn ngôn ngữ hiển thị</p>
            </div>
            <div className="preference-control">
              <select 
                value={prefs.language} 
                onChange={(e) => handleChange('language', e.target.value)}
              >
                <option value="vi">🇻🇳 Tiếng Việt</option>
                <option value="en">🇬🇧 English</option>
              </select>
            </div>
          </div>

          <div className="preference-item">
            <div className="preference-label">
              <label>Tiền tệ</label>
              <p>Chọn đơn vị tiền tệ</p>
            </div>
            <div className="preference-control">
              <select 
                value={prefs.currency} 
                onChange={(e) => handleChange('currency', e.target.value)}
              >
                <option value="VND">💱 VND (₫)</option>
                <option value="USD">💵 USD ($)</option>
                <option value="EUR">💶 EUR (€)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Email Notifications */}
        <div className="preferences-section">
          <h2 className="section-title">📧 Thông báo qua Email</h2>
          
          <div className="preference-item">
            <div className="preference-label">
              <label htmlFor="orderStatus">📦 Trạng thái đơn hàng</label>
              <p>Nhận thông báo khi đơn hàng cập nhật</p>
            </div>
            <div className="preference-control">
              <input 
                type="checkbox" 
                id="orderStatus"
                checked={prefs.emailNotifications?.orderStatus || false}
                onChange={(e) => handleEmailNotificationChange('orderStatus', e.target.checked)}
              />
            </div>
          </div>

          <div className="preference-item">
            <div className="preference-label">
              <label htmlFor="promotions">🎉 Khuyến mãi đặc biệt</label>
              <p>Nhận ưu đãi và khuyến mãi độc quyền</p>
            </div>
            <div className="preference-control">
              <input 
                type="checkbox" 
                id="promotions"
                checked={prefs.emailNotifications?.promotions || false}
                onChange={(e) => handleEmailNotificationChange('promotions', e.target.checked)}
              />
            </div>
          </div>

          <div className="preference-item">
            <div className="preference-label">
              <label htmlFor="newArrivals">✨ Sách mới nhất</label>
              <p>Được thông báo về sách mới</p>
            </div>
            <div className="preference-control">
              <input 
                type="checkbox" 
                id="newArrivals"
                checked={prefs.emailNotifications?.newArrivals || false}
                onChange={(e) => handleEmailNotificationChange('newArrivals', e.target.checked)}
              />
            </div>
          </div>

          <div className="preference-item">
            <div className="preference-label">
              <label htmlFor="recommendations">💡 Gợi ý cá nhân</label>
              <p>Nhận gợi ý dựa trên lịch sử của bạn</p>
            </div>
            <div className="preference-control">
              <input 
                type="checkbox" 
                id="recommendations"
                checked={prefs.emailNotifications?.recommendations || false}
                onChange={(e) => handleEmailNotificationChange('recommendations', e.target.checked)}
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="button-group">
          <button onClick={handleSave} className="btn btn-primary">
            💾 Lưu cài đặt
          </button>
        </div>
        
        {saved && <div className="success-message show">✅ Đã lưu thành công!</div>}
        {error && <div className="error-message show">{error}</div>}
      </div>
    </div>
  );
}
