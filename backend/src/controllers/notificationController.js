const Notification = require('../models/Notification');

// GET - Lấy notifications
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .populate('order', 'orderCode totalPrice status')
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
    if (!notification) {
      return res.status(404).json({ message: 'Thông báo không tồn tại' });
    }
    res.json({ success: true, data: notification });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE - Xóa notification
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Thông báo không tồn tại' });
    }
    res.json({ success: true, message: 'Đã xóa thông báo' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET - Lấy số lượng thông báo chưa đọc
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      user: req.user._id, 
      isRead: false 
    });
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { 
  getNotifications, 
  markAsRead, 
  deleteNotification, 
  getUnreadCount 
};
