# 🤖 AI/Agent Implementation Guide - 4 Models

**Mục đích:** Hướng dẫn chi tiết để AI/Agent tự động implement 4 models vào project.

Các bạn có thể copy toàn bộ hướng dẫn này vào prompt của ChatGPT/Claude/AI khác để chúng implement nhanh.

---

## 📌 PROJECT CONTEXT

**Tech Stack:**
- Backend: Node.js + Express.js + MongoDB (Mongoose)
- Frontend: React 19 + Vite + Context API
- Auth: JWT
- Cấu trúc file theo MVC pattern (/models, /controllers, /routes, /services)

**Project Path:** `/backend/src/` và `/frontend/src/`

---

## 🎯 TASK OVERVIEW

Tạo 4 models mới với full backend & frontend implementation:

1. **Wishlist** - Lưu sách yêu thích
2. **SearchHistory** - Ghi lại tìm kiếm
3. **Notification** - Thông báo duyệt đơn (IMPORTANT: integrate vào adminController)
4. **UserPreferences** - Cài đặt cá nhân

---

## ⚠️ REQUIREMENTS & CONSTRAINTS

- ✅ Không sửa models cũ (User, Book, Order, etc.)
- ✅ Mỗi model độc lập hoàn toàn, không phụ thuộc nhau
- ✅ Tất cả endpoints phải có auth middleware
- ✅ Error handling chuẩn (try-catch, status codes)
- ✅ Populate references đúng
- ✅ Frontend & Backend communicate thành công qua API
- ⚠️ CRITICAL: Notification model PHẢI integrate vào adminUpdateOrderStatus()

---

## 📋 IMPLEMENTATION CHECKLIST

Sau khi implement xong, kiểm tra:

### Backend
- [ ] Model file tạo thành công (schema hợp lệ)
- [ ] Controller file có tất cả endpoints
- [ ] Routes file định tuyến đúng, có auth middleware
- [ ] Import model & routes vào server.js
- [ ] No TypeErrors hoặc syntax errors
- [ ] Test API bằng Postman (GET, POST, PUT, DELETE tuỳ loại)

### Frontend
- [ ] Components tạo thành công
- [ ] Import api service đúng
- [ ] Gọi endpoints đúng
- [ ] UI render mà không lỗi

### Integration (chỉ cho Notification)
- [ ] SỬA adminController.js - thêm Notification.create()
- [ ] Import Notification model ở đầu adminController.js
- [ ] Test: Tạo order → Admin duyệt → Check DB notification được tạo

---

## 🟢 MODEL 1: WISHLIST

### Backend Implementation

#### Step 1: Create Model
**File:** `backend/src/models/Wishlist.js`

```javascript
const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
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

#### Step 2: Create Controller
**File:** `backend/src/controllers/wishlistController.js`

```javascript
const Wishlist = require('../models/Wishlist');

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

const addToWishlist = async (req, res) => {
  try {
    const { bookId } = req.body;
    if (!bookId) return res.status(400).json({ message: 'bookId không được trống' });

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

#### Step 3: Create Routes
**File:** `backend/src/routes/wishlist.js`

```javascript
const express = require('express');
const { auth } = require('../middleware/auth');
const { getWishlist, addToWishlist, removeFromWishlist } = require('../controllers/wishlistController');

const router = express.Router();

router.get('/', auth, getWishlist);
router.post('/add', auth, addToWishlist);
router.delete('/remove/:bookId', auth, removeFromWishlist);

module.exports = router;
```

#### Step 4: Register Routes in server.js
**File:** `backend/server.js`

Tìm phần `app.use('/api/...')` và thêm:
```javascript
app.use('/api/wishlist', require('./src/routes/wishlist'));
```

### Frontend Implementation

#### Create Wishlist Component
**File:** `frontend/src/components/WishlistPage.jsx`

```javascript
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import '../styles/Wishlist.css';

export default function WishlistPage() {
  const { user } = useContext(AuthContext);
  const [wishlist, setWishlist] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.get('/api/wishlist')
      .then(res => {
        setWishlist(res.data.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [user]);

  const handleRemove = async (bookId) => {
    await api.delete(`/api/wishlist/remove/${bookId}`);
    setWishlist(prev => ({
      ...prev,
      books: prev.books.filter(b => b._id !== bookId)
    }));
  };

  if (!user) return <div>Vui lòng đăng nhập</div>;
  if (loading) return <div>Đang tải...</div>;

  return (
    <div className="wishlist-page">
      <h1>❤️ Danh sách yêu thích</h1>
      {wishlist?.books?.length === 0 ? (
        <p>Chuyên mục này trống</p>
      ) : (
        <div className="wishlist-grid">
          {wishlist?.books?.map(book => (
            <div key={book._id} className="wishlist-item">
              <img src={book.imageUrl} alt={book.title} />
              <h3>{book.title}</h3>
              <p className="author">{book.author}</p>
              <p className="price">{book.price.toLocaleString('vi-VN')} ₫</p>
              <button onClick={() => handleRemove(book._id)}>❌ Xóa</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 🟢 MODEL 2: SEARCH HISTORY

### Backend Implementation

#### Step 1: Create Model
**File:** `backend/src/models/SearchHistory.js`

```javascript
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

// TTL index: tự động xóa record sau 30 ngày
searchHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('SearchHistory', searchHistorySchema);
```

#### Step 2: Create Controller
**File:** `backend/src/controllers/searchHistoryController.js`

```javascript
const SearchHistory = require('../models/SearchHistory');

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

const deleteSearchRecord = async (req, res) => {
  try {
    const { id } = req.params;
    await SearchHistory.findByIdAndDelete(id);
    res.json({ success: true, message: 'Đã xóa' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const clearSearchHistory = async (req, res) => {
  try {
    await SearchHistory.deleteMany({ user: req.user._id });
    res.json({ success: true, message: 'Đã xóa toàn bộ lịch sử' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = { 
  saveSearchHistory, 
  getSearchHistory, 
  deleteSearchRecord, 
  clearSearchHistory 
};
```

#### Step 3: Create Routes
**File:** `backend/src/routes/searchHistory.js`

```javascript
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

#### Step 4: Register Routes in server.js
```javascript
app.use('/api/search-history', require('./src/routes/searchHistory'));
```

#### Step 5: Integrate with Book Search (SỬA bookController.js)
**File:** `backend/src/controllers/bookController.js`

Tìm hàm search books, thêm vào cuối hàm (trước res.json):
```javascript
// Auto-log search history nếu user đã login
if (req.user) {
  require('../models/SearchHistory').create({
    user: req.user._id,
    keyword: search || '',
    filters: { category, priceMin, priceMax },
    resultsCount: books.length
  }).catch(err => console.log('SearchHistory error:', err));
}
```

### Frontend Implementation

#### Create RecentSearches Component
**File:** `frontend/src/components/RecentSearches.jsx`

```javascript
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

export default function RecentSearches() {
  const { user } = useContext(AuthContext);
  const [searches, setSearches] = useState([]);

  useEffect(() => {
    if (!user) return;
    api.get('/api/search-history')
      .then(res => setSearches(res.data.data))
      .catch(() => setSearches([]));
  }, [user]);

  const handleSearch = (keyword) => {
    // Redirect to search with keyword
    window.location.href = `/books?search=${keyword}`;
  };

  return (
    <div className="recent-searches">
      <h3>🔍 Tìm kiếm gần đây</h3>
      {searches.length === 0 ? (
        <p>Không có tìm kiếm gần đây</p>
      ) : (
        <ul>
          {searches.slice(0, 5).map(search => (
            <li key={search._id}>
              <span onClick={() => handleSearch(search.keyword)}>
                {search.keyword}
              </span>
              <small>{search.resultsCount} kết quả</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

---

## 🟢 MODEL 3: NOTIFICATION ⭐ CRITICAL

### Backend Implementation

#### Step 1: Create Model
**File:** `backend/src/models/Notification.js`

```javascript
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

#### Step 2: Create Controller
**File:** `backend/src/controllers/notificationController.js`

```javascript
const Notification = require('../models/Notification');

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

#### Step 3: Create Routes
**File:** `backend/src/routes/notification.js`

```javascript
const express = require('express');
const { auth } = require('../middleware/auth');
const { 
  getNotifications, 
  markAsRead, 
  deleteNotification 
} = require('../controllers/notificationController');

const router = express.Router();

router.get('/', auth, getNotifications);
router.patch('/:id/read', auth, markAsRead);
router.delete('/:id', auth, deleteNotification);

module.exports = router;
```

#### Step 4: ⚠️ CRITICAL - SỬA adminController.js
**File:** `backend/src/controllers/adminController.js`

**Action:** Thêm dòng này ở đầu file (sau các require kh��c):
```javascript
const Notification = require('../models/Notification');
```

**Tìm hàm:** `adminUpdateOrderStatus` (xung quanh line 89)

**Thay thế toàn bộ hàm này:**
```javascript
const adminUpdateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
    
    // ✨ TỰ ĐỘNG TẠO NOTIFICATION KHI ADMIN DUYỆT
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

#### Step 5: Register Routes in server.js
```javascript
app.use('/api/notifications', require('./src/routes/notification'));
```

### Frontend Implementation

#### Create NotificationBell Component
**File:** `frontend/src/components/NotificationBell.jsx`

```javascript
import { useContext, useEffect, useState } from 'react';
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

#### Create NotificationBell CSS
**File:** `frontend/src/components/NotificationBell.css`

```css
.notification-bell {
  position: relative;
}

.bell-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  position: relative;
}

.badge {
  position: absolute;
  top: -5px;
  right: -10px;
  background: red;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.notification-dropdown {
  position: absolute;
  top: 40px;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  width: 300px;
  max-height: 400px;
  overflow-y: auto;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  z-index: 1000;
}

.notification-item {
  padding: 12px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background 0.2s;
}

.notification-item:hover {
  background: #f5f5f5;
}

.notification-item.unread {
  background: #e3f2fd;
}

.notification-item strong {
  display: block;
  margin-bottom: 4px;
}

.notification-item p {
  margin: 4px 0;
  font-size: 13px;
  color: #666;
}

.notification-item small {
  font-size: 11px;
  color: #999;
}

.empty {
  padding: 16px;
  text-align: center;
  color: #999;
}
```

#### Add to Navbar
**File:** `frontend/src/components/Navbar/Navbar.jsx`

Import và thêm component:
```javascript
import NotificationBell from '../NotificationBell';

// Trong JSX, thêm vào navbar:
<NotificationBell />
```

---

## 🟢 MODEL 4: USER PREFERENCES

### Backend Implementation

#### Step 1: Create Model
**File:** `backend/src/models/UserPreferences.js`

```javascript
const mongoose = require('mongoose');

const userPreferencesSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
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
  emailNotifications: {
    orderStatus: { type: Boolean, default: true },
    promotions: { type: Boolean, default: true },
    newArrivals: { type: Boolean, default: false },
    recommendations: { type: Boolean, default: true }
  },
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

#### Step 2: Create Controller
**File:** `backend/src/controllers/userPreferencesController.js`

```javascript
const UserPreferences = require('../models/UserPreferences');

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

#### Step 3: Create Routes
**File:** `backend/src/routes/userPreferences.js`

```javascript
const express = require('express');
const { auth } = require('../middleware/auth');
const { 
  getUserPreferences, 
  updateUserPreferences 
} = require('../controllers/userPreferencesController');

const router = express.Router();

router.get('/', auth, getUserPreferences);
router.put('/', auth, updateUserPreferences);

module.exports = router;
```

#### Step 4: Register Routes in server.js
```javascript
app.use('/api/user-preferences', require('./src/routes/userPreferences'));
```

### Frontend Implementation

#### Create Settings Page
**File:** `frontend/src/pages/Settings.jsx`

```javascript
import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import '../styles/Settings.css';

export default function Settings() {
  const { user } = useContext(AuthContext);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    api.get('/api/user-preferences')
      .then(res => {
        setPreferences(res.data.data);
        setLoading(false);
      });
  }, [user]);

  const handleUpdate = async (updates) => {
    try {
      const res = await api.put('/api/user-preferences', updates);
      setPreferences(res.data.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return <div>Vui lòng đăng nhập</div>;
  if (loading) return <div>Đang tải...</div>;

  return (
    <div className="settings-page">
      <h1>⚙️ Cài đặt</h1>
      {saved && <div className="success-msg">✅ Đã lưu</div>}

      <div className="settings-container">
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
    </div>
  );
}
```

#### Create Settings CSS
**File:** `frontend/src/styles/Settings.css`

```css
.settings-page {
  max-width: 500px;
  margin: 40px auto;
  padding: 20px;
}

.success-msg {
  background: #d4edda;
  color: #155724;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.settings-container {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
}

.setting-group {
  margin-bottom: 20px;
}

.setting-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
}

.setting-group select,
.setting-group input[type="checkbox"] {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.checkboxes {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkboxes label {
  display: flex;
  align-items: center;
  gap: 8px;
  width: auto;
}

.checkboxes input[type="checkbox"] {
  width: auto;
}
```

---

## ✅ FINAL CHECKLIST

### Cần làm (Copy-paste & test):

**Backend (mỗi model):**
- [ ] Model file created & schema valid
- [ ] Controller file created & all functions work
- [ ] Routes file created & endpoints mapped
- [ ] Routes imported in server.js
- [ ] Test dengan Postman

**Frontend (mỗi model):**
- [ ] Component created
- [ ] CSS created
- [ ] API calls work
- [ ] UI renders without errors

**Integration (CHỈ Notification):**
- [ ] ✅ adminController.js SỬA xong - thêm Notification.create()
- [ ] ✅ Import Notification model ở đầu
- [ ] Test: Tạo order → Admin duyệt → Notification được tạo trong DB

---

## 🚀 QUICK START FOR AI/AGENT

Copy instruction này và prompt vào ChatGPT/Claude:

```
Implement 4 backend models vào Express/MongoDB project:
1. Create model file
2. Create controller file
3. Create routes file
4. Register routes in server.js
5. Implement frontend component (if applicable)

Models:
1. Wishlist - [chi tiết từ document trên]
2. SearchHistory - [chi tiết từ document trên]
3. Notification - [chi tiết từ document trên + SỬA adminController.js]
4. UserPreferences - [chi tiết từ document trên]

Code phải có:
- Error handling (try-catch)
- Auth middleware (tất cả endpoints)
- Proper Mongoose schema
- Proper HTTP status codes
```

---

**Good luck! 🎉 Copy document này để các bạn implement nhanh!**
