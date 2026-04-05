# 📋 Kế hoạch Phát triển 4 Models Mới - DACK-Thu4

**Thời gian:** Tuần 1-2 | **Nhóm:** 4 người | **Mục tiêu:** Thêm 4 models nhẹ nhàng, không conflict

---

## 📊 Tóm tắt

| **Model** | **Person** | **Mục đích** | **Độ phức tạp** | **Thời gian** |
|-----------|-----------|-----------|--------|---------|
| **Wishlist** | Person 1 | Lưu sách yêu thích | 🟢 Rất nhẹ | 2 ngày |
| **SearchHistory** | Person 2 | Ghi lại tìm kiếm | 🟢 Rất nhẹ | 2 ngày |
| **Notification** | Person 3 | Thông báo duyệt đơn | 🟢 Nhẹ | 3 ngày |
| **UserPreferences** | Person 4 | Cài đặt cá nhân | 🟢 Nhẹ | 2 ngày |

---

## 🟢 MODEL 1: WISHLIST (Person 1)

### 📍 Mục đích
- User có thể lưu sách yêu thích (giống bookmark)
- View danh sách wishlist riêng
- Thêm/xóa sách khỏi wishlist

### 🏗️ Schema

```javascript
// backend/src/models/Wishlist.js
const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true  // 1 wishlist/user
  },
  books: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book'
    }
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Wishlist', wishlistSchema);
```

### 📤 API Endpoints

| Phương thức | Endpoint | Mục đích |
|-----------|----------|---------|
| GET | `/api/wishlist` | Lấy wishlist của user |
| POST | `/api/wishlist/add` | Thêm sách vào wishlist |
| DELETE | `/api/wishlist/remove/:bookId` | Xóa sách khỏi wishlist |

### 💻 Controller

```javascript
// backend/src/controllers/wishlistController.js
const Wishlist = require('../models/Wishlist');

// GET - Lấy wishlist
const getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id }).populate('books');
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, books: [] });
    }
    res.json({ success: true, data: wishlist });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST - Thêm sách
const addToWishlist = async (req, res) => {
  try {
    const { bookId } = req.body;
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, books: [bookId] });
    } else if (!wishlist.books.includes(bookId)) {
      wishlist.books.push(bookId);
      await wishlist.save();
    }
    
    res.json({ success: true, data: wishlist });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE - Xóa sách
const removeFromWishlist = async (req, res) => {
  try {
    const { bookId } = req.params;
    const wishlist = await Wishlist.findOneAndUpdate(
      { user: req.user._id },
      { $pull: { books: bookId } },
      { new: true }
    ).populate('books');
    
    res.json({ success: true, data: wishlist });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
```

### 🛣️ Routes

```javascript
// backend/src/routes/wishlist.js
const express = require('express');
const { auth } = require('../middleware/auth');
const { getWishlist, addToWishlist, removeFromWishlist } = require('../controllers/wishlistController');

const router = express.Router();

router.get('/', auth, getWishlist);
router.post('/add', auth, addToWishlist);
router.delete('/remove/:bookId', auth, removeFromWishlist);

module.exports = router;

// Trong server.js: app.use('/api/wishlist', require('./routes/wishlist'));
```

### ✅ Checklist Person 1
- [ ] Tạo file `Wishlist.js` model
- [ ] Tạo file `wishlistController.js`
- [ ] Tạo file `wishlist.js` routes
- [ ] Thêm route vào `server.js`: `app.use('/api/wishlist', ...)`
- [ ] Test API bằng Postman
- [ ] Tạo UI trên frontend (💖 button trên ProductCard & Wishlist page)

---

## 🟢 MODEL 2: SEARCH HISTORY (Person 2)

### 📍 Mục đích
- Ghi lại các lần user tìm kiếm (keyword, filters)
- Dùng cho analytics & recommendation sau
- User có thể xem lịch sử tìm kiếm của mình

### 🏗️ Schema

```javascript
// backend/src/models/SearchHistory.js
const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  keyword: {
    type: String,
    required: true
  },
  filters: {
    category: String,
    priceMin: Number,
    priceMax: Number,
    author: String
  },
  resultsCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Tự động xóa record sau 30 ngày (optional)
searchHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('SearchHistory', searchHistorySchema);
```

### 📤 API Endpoints

| Phương thức | Endpoint | Mục đích |
|-----------|----------|---------|
| POST | `/api/search-history` | Lưu tìm kiếm (gọi từ search endpoint) |
| GET | `/api/search-history` | Lấy lịch sử tìm kiếm |
| DELETE | `/api/search-history/:id` | Xóa 1 record |
| DELETE | `/api/search-history` | Xóa toàn bộ lịch sử |

### 💻 Controller

```javascript
// backend/src/controllers/searchHistoryController.js
const SearchHistory = require('../models/SearchHistory');

// POST - Lưu search (gọi từ book search endpoint)
const saveSearchHistory = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Cần đăng nhập' });
    
    const { keyword, filters, resultsCount } = req.body;
    
    const search = await SearchHistory.create({
      user: req.user._id,
      keyword,
      filters: filters || {},
      resultsCount: resultsCount || 0
    });
    
    res.json({ success: true, data: search });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET - Lấy lịch sử
const getSearchHistory = async (req, res) => {
  try {
    const searches = await SearchHistory.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, data: searches });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE - Xóa 1 record
const deleteSearchRecord = async (req, res) => {
  try {
    const { id } = req.params;
    await SearchHistory.findByIdAndDelete(id);
    res.json({ success: true, message: 'Đã xóa' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE - Xóa toàn bộ
const clearSearchHistory = async (req, res) => {
  try {
    await SearchHistory.deleteMany({ user: req.user._id });
    res.json({ success: true, message: 'Đã xóa toàn bộ lịch sử' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = { saveSearchHistory, getSearchHistory, deleteSearchRecord, clearSearchHistory };
```

### 🔄 Integration với Book Search

```javascript
// Sửa bookController.js (hàm search books)
// Thêm vào cuối hàm search:
if (req.user) {
  require('../models/SearchHistory').create({
    user: req.user._id,
    keyword: search,
    filters: { category, priceMin, priceMax },
    resultsCount: books.length
  }).catch(err => console.log('Search history error:', err));
}
```

### 🛣️ Routes

```javascript
// backend/src/routes/searchHistory.js
const express = require('express');
const { auth } = require('../middleware/auth');
const {
  saveSearchHistory,
  getSearchHistory,
  deleteSearchRecord,
  clearSearchHistory
} = require('../controllers/searchHistoryController');

const router = express.Router();

router.post('/', auth, saveSearchHistory);
router.get('/', auth, getSearchHistory);
router.delete('/:id', auth, deleteSearchRecord);
router.delete('/', auth, clearSearchHistory);

module.exports = router;
```

### ✅ Checklist Person 2
- [ ] Tạo file `SearchHistory.js` model
- [ ] Tạo file `searchHistoryController.js`
- [ ] Tạo file `searchHistory.js` routes
- [ ] Thêm route vào `server.js`
- [ ] Sửa `bookController.js` để auto log search
- [ ] Test API
- [ ] Tạo UI "Recent Searches" trên Books page

---

## 🟢 MODEL 3: NOTIFICATION (Person 3)

### 📍 Mục đích
**ĐƠN GIẢN: Khi admin duyệt đơn hàng → user nhận thông báo**

```
Admin: Duyệt đơn #ORD12345 → Status = "confirmed"
  ↓
Tự động tạo Notification
  ↓
User thấy: ✅ Đơn hàng được xác nhận
```

### 🏗️ Schema

```javascript
// backend/src/models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  type: {
    type: String,
    enum: ['order_confirmed', 'order_shipping', 'order_delivered', 'order_cancelled'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model('Notification', notificationSchema);
```

### 📤 API Endpoints

| Phương thức | Endpoint | Mục đích |
|-----------|----------|---------|
| GET | `/api/notifications` | Lấy notif của user |
| PATCH | `/api/notifications/:id/read` | Đánh dấu đã đọc |
| DELETE | `/api/notifications/:id` | Xóa 1 notif |

### 💻 Controller

```javascript
// backend/src/controllers/notificationController.js
const Notification = require('../models/Notification');

// GET - Lấy notifications
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ success: true, data: notifications });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH - Đánh dấu đã đọc
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    res.json({ success: true, data: notification });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE - Xóa notification
const deleteNotification = async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Đã xóa' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = { getNotifications, markAsRead, deleteNotification };
```

### 🔑 **QUAN TRỌNG: Sửa adminController.js**

**File:** `backend/src/controllers/adminController.js`

**Tìm hàm:** `adminUpdateOrderStatus` (line ~89)

**Thay thế:**
```javascript
const Notification = require('../models/Notification');

const adminUpdateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
    
    // ✨ TỰ ĐỘNG TẠO NOTIFICATION
    const notificationMessages = {
      confirmed: { 
        title: '✅ Đơn hàng được xác nhận', 
        message: `Đơn hàng #${order.orderCode} đã được xác nhận bởi cửa hàng` 
      },
      shipping: { 
        title: '🚚 Đang vận chuyển', 
        message: `Đơn hàng #${order.orderCode} đang trên đường tới bạn` 
      },
      delivered: { 
        title: '📦 Giao hàng thành công', 
        message: `Đơn hàng #${order.orderCode} đã được giao` 
      },
      cancelled: { 
        title: '❌ Đơn hàng bị hủy', 
        message: `Đơn hàng #${order.orderCode} đã bị hủy` 
      },
    };
    
    if (notificationMessages[status]) {
      await Notification.create({
        user: order.user,
        order: order._id,
        type: `order_${status}`,
        title: notificationMessages[status].title,
        message: notificationMessages[status].message,
      });
    }
    
    res.json({ success: true, data: order });
  } catch (err) { 
    res.status(400).json({ message: err.message }); 
  }
};
```

### 🛣️ Routes

```javascript
// backend/src/routes/notification.js
const express = require('express');
const { auth } = require('../middleware/auth');
const { getNotifications, markAsRead, deleteNotification } = require('../controllers/notificationController');

const router = express.Router();

router.get('/', auth, getNotifications);
router.patch('/:id/read', auth, markAsRead);
router.delete('/:id', auth, deleteNotification);

module.exports = router;

// Trong server.js: app.use('/api/notifications', require('./routes/notification'));
```

### ✅ Checklist Person 3
- [ ] Tạo file `Notification.js` model
- [ ] Tạo file `notificationController.js`
- [ ] Tạo file `notification.js` routes
- [ ] **SỬA** `adminController.js` - thêm Notification.create() vào `adminUpdateOrderStatus`
- [ ] Thêm `const Notification = require(...)` ở đầu `adminController.js`
- [ ] Thêm route vào `server.js`
- [ ] Test: Tạo order → Admin duyệt → Kiểm tra DB notification được tạo

### 🔔 UI Component (React)

```javascript
// frontend/src/components/NotificationBell.jsx
import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import './NotificationBell.css';

export default function NotificationBell() {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    // Lấy notifications lần đầu
    api.get('/api/notifications')
      .then(res => setNotifications(res.data.data))
      .catch(() => setNotifications([]));
    
    // Poll mỗi 10s
    const interval = setInterval(() => {
      api.get('/api/notifications')
        .then(res => setNotifications(res.data.data))
        .catch(() => {});
    }, 10000);
    
    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (id) => {
    await api.patch(`/api/notifications/${id}/read`);
    setNotifications(notifications.map(n => 
      n._id === id ? { ...n, isRead: true } : n
    ));
  };

  if (!user) return null;

  return (
    <div className="notification-bell">
      <button 
        className="bell-btn"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        🔔 {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          {notifications.length === 0 ? (
            <div className="empty">Không có thông báo</div>
          ) : (
            notifications.map(n => (
              <div 
                key={n._id} 
                className={`notification-item ${n.isRead ? 'read' : 'unread'}`}
                onClick={() => handleMarkAsRead(n._id)}
              >
                <strong>{n.title}</strong>
                <p>{n.message}</p>
                <small>{new Date(n.createdAt).toLocaleString('vi-VN')}</small>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
```

---

## 🟢 MODEL 4: USER PREFERENCES (Person 4)

### 📍 Mục đích
- Lưu tùy chọn cá nhân (giao diện, ngôn ngữ, email settings)
- Tương tự cài đặt trên điện thoại

### 🏗️ Schema

```javascript
// backend/src/models/UserPreferences.js
const mongoose = require('mongoose');

const userPreferencesSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // 🎨 Giao diện
  theme: {
    type: String,
    enum: ['light', 'dark', 'auto'],
    default: 'light'
  },
  language: {
    type: String,
    enum: ['vi', 'en'],
    default: 'vi'
  },
  
  // 📧 Email Notifications
  emailNotifications: {
    orderStatus: { type: Boolean, default: true },
    promotions: { type: Boolean, default: true },
    newArrivals: { type: Boolean, default: false },
    recommendations: { type: Boolean, default: true }
  },
  
  // 💱 Tùy chọn khác
  currency: {
    type: String,
    enum: ['VND', 'USD', 'EUR'],
    default: 'VND'
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserPreferences', userPreferencesSchema);
```

### 📤 API Endpoints

| Phương thức | Endpoint | Mục đích |
|-----------|----------|---------|
| GET | `/api/user-preferences` | Lấy cài đặt |
| PUT | `/api/user-preferences` | Cập nhật cài đặt |

### 💻 Controller

```javascript
// backend/src/controllers/userPreferencesController.js
const UserPreferences = require('../models/UserPreferences');

// GET - Lấy preferences
const getUserPreferences = async (req, res) => {
  try {
    let prefs = await UserPreferences.findOne({ user: req.user._id });
    
    if (!prefs) {
      prefs = await UserPreferences.create({ 
        user: req.user._id,
        theme: 'light',
        language: 'vi'
      });
    }
    
    res.json({ success: true, data: prefs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT - Cập nhật preferences
const updateUserPreferences = async (req, res) => {
  try {
    const prefs = await UserPreferences.findOneAndUpdate(
      { user: req.user._id },
      { ...req.body, updatedAt: Date.now() },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: prefs });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = { getUserPreferences, updateUserPreferences };
```

### 🛣️ Routes

```javascript
// backend/src/routes/userPreferences.js
const express = require('express');
const { auth } = require('../middleware/auth');
const { getUserPreferences, updateUserPreferences } = require('../controllers/userPreferencesController');

const router = express.Router();

router.get('/', auth, getUserPreferences);
router.put('/', auth, updateUserPreferences);

module.exports = router;

// Trong server.js: app.use('/api/user-preferences', require('./routes/userPreferences'));
```

### 🎨 UI Settings Page (React)

```javascript
// frontend/src/pages/Settings.jsx
import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import './Settings.css';

export default function Settings() {
  const { user } = useContext(AuthContext);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/user-preferences')
      .then(res => {
        setPreferences(res.data.data);
        setLoading(false);
      });
  }, []);

  const handleUpdate = async (updates) => {
    const res = await api.put('/api/user-preferences', updates);
    setPreferences(res.data.data);
  };

  if (loading) return <div>Đang tải...</div>;
  if (!preferences) return <div>Lỗi tải cài đặt</div>;

  return (
    <div className="settings-page">
      <h1>⚙️ Cài đặt</h1>

      {/* Theme */}
      <div className="setting-group">
        <label>🎨 Chế độ hiển thị:</label>
        <select
          value={preferences.theme}
          onChange={(e) => handleUpdate({ theme: e.target.value })}
        >
          <option value="light">☀️ Sáng</option>
          <option value="dark">🌙 Tối</option>
          <option value="auto">🔄 Tự động</option>
        </select>
      </div>

      {/* Language */}
      <div className="setting-group">
        <label>🗣️ Ngôn ngữ:</label>
        <select
          value={preferences.language}
          onChange={(e) => handleUpdate({ language: e.target.value })}
        >
          <option value="vi">🇻🇳 Tiếng Việt</option>
          <option value="en">🇺🇸 English</option>
        </select>
      </div>

      {/* Currency */}
      <div className="setting-group">
        <label>💱 Tiền tệ:</label>
        <select
          value={preferences.currency}
          onChange={(e) => handleUpdate({ currency: e.target.value })}
        >
          <option value="VND">đ VND</option>
          <option value="USD">$ USD</option>
          <option value="EUR">€ EUR</option>
        </select>
      </div>

      {/* Email Notifications */}
      <div className="setting-group">
        <label>📧 Thông báo Email:</label>
        <div className="checkboxes">
          <label>
            <input
              type="checkbox"
              checked={preferences.emailNotifications.orderStatus}
              onChange={(e) => handleUpdate({
                emailNotifications: {
                  ...preferences.emailNotifications,
                  orderStatus: e.target.checked
                }
              })}
            />
            ✅ Trạng thái đơn hàng
          </label>
          <label>
            <input
              type="checkbox"
              checked={preferences.emailNotifications.promotions}
              onChange={(e) => handleUpdate({
                emailNotifications: {
                  ...preferences.emailNotifications,
                  promotions: e.target.checked
                }
              })}
            />
            🎉 Khuyến mãi
          </label>
          <label>
            <input
              type="checkbox"
              checked={preferences.emailNotifications.newArrivals}
              onChange={(e) => handleUpdate({
                emailNotifications: {
                  ...preferences.emailNotifications,
                  newArrivals: e.target.checked
                }
              })}
            />
            📚 Sách mới
          </label>
          <label>
            <input
              type="checkbox"
              checked={preferences.emailNotifications.recommendations}
              onChange={(e) => handleUpdate({
                emailNotifications: {
                  ...preferences.emailNotifications,
                  recommendations: e.target.checked
                }
              })}
            />
            💡 Gợi ý sách
          </label>
        </div>
      </div>
    </div>
  );
}
```

### ✅ Checklist Person 4
- [ ] Tạo file `UserPreferences.js` model
- [ ] Tạo file `userPreferencesController.js`
- [ ] Tạo file `userPreferences.js` routes
- [ ] Thêm route vào `server.js`
- [ ] Test API GET/PUT
- [ ] Tạo Settings page trên frontend

---

## 🔄 **Timeline & Dependencies**

### **Week 1**
```
Mon-Tue: Tất cả 4 người làm models & controllers (độc lập)
  - Person 1: Wishlist
  - Person 2: SearchHistory
  - Person 3: Notification (sửa adminController.js)
  - Person 4: UserPreferences

Wed: Merge code, test API bằng Postman

```

### **Week 2**
```
Mon-Tue: Frontend UI
  - Person 1: Wishlist UI (button 💖, wishlist page)
  - Person 2: Recent searches UI
  - Person 3: Notification bell 🔔
  - Person 4: Settings page ⚙️

Wed-Thu: QA & fix bugs
```

---

## 📋 **Git Strategy (Tránh Conflict)**

### **Tạo branch riêng**
```bash
git checkout -b feature/wishlist
git checkout -b feature/search-history
git checkout -b feature/notifications
git checkout -b feature/user-preferences
```

### **Các file cần sửa (CHIA NHÂN)**
| File | Người sửa | Phần |
|------|-----------|------|
| `server.js` | **Person 3 trước** | Thêm routes import |
| `adminController.js` | **Person 3** | Sửa `adminUpdateOrderStatus()` |
| `bookController.js` | **Person 2** | Thêm SearchHistory.create() |

**Lorder merge:** Person 3 → Person 2 → Person 1 → Person 4

---

## ✨ **Output của Person 3 (Notification)**

**Backend files:**
- ✅ `backend/src/models/Notification.js`
- ✅ `backend/src/controllers/notificationController.js`
- ✅ `backend/src/routes/notification.js`
- ✅ Sửa `backend/src/controllers/adminController.js` (thêm Notification logic)

**Frontend:**
- ✅ `frontend/src/components/NotificationBell.jsx`
- ✅ `frontend/src/components/NotificationBell.css`

---

## 📚 **Tài liệu Tham khảo**

- [Mongoose Documentation](https://mongoosejs.com/)
- [Express API Patterns](https://expressjs.com/en/api/router.html)
- Backend: Xem pattern trong hiện tại `/backend/src/controllers/`
- Frontend: Xem pattern trong `/frontend/src/context/` & `/frontend/src/services/`

---

## ✅ **Validation Checklist Chung**

- [ ] Tất cả 4 models tạo thành công
- [ ] Tất cả routes hoạt động (test Postman)
- [ ] Không conflict khi merge branches
- [ ] Auth middleware áp dụng đúng (mọi endpoint đều check `auth`)
- [ ] Error handling chính xác
- [ ] Frontend & Backend communicate thành công
- [ ] Demo được với team

---

**Good luck! 🚀 Hoàn thành trong 2 tuần!**
