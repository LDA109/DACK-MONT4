import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './NotificationBell.css';

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  // Lấy notifications
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data);
        const unread = res.data.data.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load notifications khi component mount hoặc user thay đổi
  useEffect(() => {
    fetchNotifications();
    
    // Poll mỗi 10 giây
    const interval = setInterval(() => {
      fetchNotifications();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [user]);

  // Đánh dấu đã đọc
  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => 
        n._id === id ? { ...n, isRead: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  // Xóa notification
  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      const notification = notifications.find(n => n._id === id);
      setNotifications(notifications.filter(n => n._id !== id));
      if (notification && !notification.isRead) {
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  if (!user) return null;

  return (
    <div className="notification-bell">
      <button 
        className="bell-btn"
        onClick={() => setShowDropdown(!showDropdown)}
        title="Thông báo"
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="dropdown-header">
            <h3>Thông báo</h3>
            {notifications.length > 0 && (
              <button
                className="close-btn"
                onClick={() => setShowDropdown(false)}
              >
                ✕
              </button>
            )}
          </div>

          <div className="notification-list">
            {loading && <div className="loading">Đang tải...</div>}
            
            {!loading && notifications.length === 0 && (
              <div className="empty">
                <span>📭 Không có thông báo</span>
              </div>
            )}
            
            {!loading && notifications.map(notification => (
              <div 
                key={notification._id} 
                className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
              >
                <div className="notification-content">
                  <div className="notification-title">{notification.title}</div>
                  <div className="notification-message">{notification.message}</div>
                  <div className="notification-time">
                    {new Date(notification.createdAt).toLocaleString('vi-VN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                
                <div className="notification-actions">
                  {!notification.isRead && (
                    <button
                      className="action-btn read-btn"
                      onClick={() => handleMarkAsRead(notification._id)}
                      title="Đánh dấu đã đọc"
                    >
                      ✓
                    </button>
                  )}
                  <button
                    className="action-btn delete-btn"
                    onClick={() => handleDelete(notification._id)}
                    title="Xóa"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          {notifications.length > 0 && (
            <div className="dropdown-footer">
              <small>{unreadCount} thông báo chưa đọc</small>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
