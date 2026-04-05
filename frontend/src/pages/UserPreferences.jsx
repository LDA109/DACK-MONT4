import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userPreferencesAPI } from '../services/api';
import '../styles/UserPreferences.css';

export default function UserPreferencesPage() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchPreferences();
  }, [user]);

  const fetchPreferences = async () => {
    try {
      const res = await userPreferencesAPI.getPreferences();
      setPrefs(res.data.data);
    } catch (err) {
      console.error('Lỗi lấy cài đặt:', err);
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
      await userPreferencesAPI.updatePreferences({
        theme: prefs.theme,
        language: prefs.language,
        currency: prefs.currency,
        emailNotifications: prefs.emailNotifications
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Lỗi lưu cài đặt:', err);
    }
  };

  if (!user) {
    return <div className="preferences-page"><p>Vui lòng đăng nhập</p></div>;
  }

  if (loading) {
    return <div className="preferences-page"><p>💫 Đang tải...</p></div>;
  }

  if (!prefs) {
    return <div className="preferences-page"><p>⚠️ Không thể tải cài đặt</p></div>;
  }

  return (
    <div className="preferences-page">
      <div className="prefs-header">
        <h1>⚙️ Cài đặt</h1>
        <p className="subtitle">Quản lý tùy chọn cá nhân của bạn</p>
      </div>

      <div className="prefs-container">
        {/* Giao diện */}
        <div className="pref-section">
          <h2>🎨 Giao diện</h2>
          
          <div className="pref-item">
            <label>Chủ đề:</label>
            <select 
              value={prefs.theme} 
              onChange={(e) => handleChange('theme', e.target.value)}
              className="pref-select"
            >
              <option value="light">☀️ Sáng</option>
              <option value="dark">🌙 Tối</option>
              <option value="auto">🔄 Tự động</option>
            </select>
          </div>

          <div className="pref-item">
            <label>Ngôn ngữ:</label>
            <select 
              value={prefs.language} 
              onChange={(e) => handleChange('language', e.target.value)}
              className="pref-select"
            >
              <option value="vi">🇻🇳 Tiếng Việt</option>
              <option value="en">🇬🇧 English</option>
            </select>
          </div>

          <div className="pref-item">
            <label>Tiền tệ:</label>
            <select 
              value={prefs.currency} 
              onChange={(e) => handleChange('currency', e.target.value)}
              className="pref-select"
            >
              <option value="VND">💱 VND (₫)</option>
              <option value="USD">💵 USD ($)</option>
              <option value="EUR">💶 EUR (€)</option>
            </select>
          </div>
        </div>

        {/* Email Notifications */}
        <div className="pref-section">
          <h2>📧 Thông báo qua Email</h2>
          
          <div className="pref-checkbox">
            <input 
              type="checkbox" 
              id="orderStatus"
              checked={prefs.emailNotifications.orderStatus}
              onChange={(e) => handleEmailNotificationChange('orderStatus', e.target.checked)}
            />
            <label htmlFor="orderStatus">
              📦 Trạng thái đơn hàng
            </label>
          </div>

          <div className="pref-checkbox">
            <input 
              type="checkbox" 
              id="promotions"
              checked={prefs.emailNotifications.promotions}
              onChange={(e) => handleEmailNotificationChange('promotions', e.target.checked)}
            />
            <label htmlFor="promotions">
              🎉 Khuyến mãi đặc biệt
            </label>
          </div>

          <div className="pref-checkbox">
            <input 
              type="checkbox" 
              id="newArrivals"
              checked={prefs.emailNotifications.newArrivals}
              onChange={(e) => handleEmailNotificationChange('newArrivals', e.target.checked)}
            />
            <label htmlFor="newArrivals">
              ✨ Sách mới nhất
            </label>
          </div>

          <div className="pref-checkbox">
            <input 
              type="checkbox" 
              id="recommendations"
              checked={prefs.emailNotifications.recommendations}
              onChange={(e) => handleEmailNotificationChange('recommendations', e.target.checked)}
            />
            <label htmlFor="recommendations">
              💡 Gợi ý cá nhân
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="pref-actions">
          <button onClick={handleSave} className="btn-save">
            💾 Lưu cài đặt
          </button>
          {saved && <p className="success-msg">✅ Đã lưu thành công!</p>}
        </div>
      </div>
    </div>
  );
}
