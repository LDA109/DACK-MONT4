const Book = require('../models/Book');
const Category = require('../models/Category');
const Order = require('../models/Order');
const User = require('../models/User');
const Notification = require('../models/Notification');

// ===== BOOKS =====
const adminGetBooks = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category, type } = req.query;
    const query = {};
    if (search) query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { author: { $regex: search, $options: 'i' } },
    ];
    if (category) query.category = category;
    if (type) query.type = type;
    const total = await Book.countDocuments(query);
    const books = await Book.find(query).populate('category', 'name').sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(Number(limit)).lean();
    res.json({ success: true, data: books, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const adminCreateBook = async (req, res) => {
  try {
    const book = await Book.create(req.body);
    res.status(201).json({ success: true, data: book });
  } catch (err) { res.status(400).json({ message: err.message }); }
};

const adminUpdateBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!book) return res.status(404).json({ message: 'Không tìm thấy sách.' });
    res.json({ success: true, data: book });
  } catch (err) { res.status(400).json({ message: err.message }); }
};

const adminDeleteBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ message: 'Không tìm thấy sách.' });
    res.json({ success: true, message: 'Đã xóa sách.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ===== CATEGORIES =====
const adminGetCategories = async (req, res) => {
  try {
    const cats = await Category.find().sort({ order: 1 }).lean();
    res.json({ success: true, data: cats });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const adminCreateCategory = async (req, res) => {
  try {
    const cat = await Category.create(req.body);
    res.status(201).json({ success: true, data: cat });
  } catch (err) { res.status(400).json({ message: err.message }); }
};

const adminUpdateCategory = async (req, res) => {
  try {
    const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cat) return res.status(404).json({ message: 'Không tìm thấy danh mục.' });
    res.json({ success: true, data: cat });
  } catch (err) { res.status(400).json({ message: err.message }); }
};

const adminDeleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Đã xóa danh mục.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ===== ORDERS =====
const adminGetOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = status ? { status } : {};
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query).populate('user', 'name email').sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(Number(limit)).lean();
    res.json({ success: true, data: orders, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

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
      }).catch(err => console.log('Notification creation error:', err));
    }
    
    res.json({ success: true, data: order });
  } catch (err) { res.status(400).json({ message: err.message }); }
};

// ===== USERS =====
const adminGetUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = search ? { $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] } : {};
    const total = await User.countDocuments(query);
    const users = await User.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)).lean();
    res.json({ success: true, data: users, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const adminUpdateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) return res.status(400).json({ message: 'Role không hợp lệ.' });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ message: 'Không tìm thấy user.' });
    res.json({ success: true, data: user });
  } catch (err) { res.status(400).json({ message: err.message }); }
};

const adminToggleUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy user.' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, data: user, message: user.isActive ? 'Đã mở khoá.' : 'Đã khoá tài khoản.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ===== STATS =====
const adminGetStats = async (req, res) => {
  try {
    const [totalBooks, totalOrders, totalUsers, totalCategories] = await Promise.all([
      Book.countDocuments({ isActive: true }),
      Order.countDocuments(),
      User.countDocuments(),
      Category.countDocuments({ isActive: true }),
    ]);
    const revenueAgg = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$finalTotal' } } },
    ]);
    const revenue = revenueAgg[0]?.total || 0;

    const recentOrders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(5).lean();
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const monthlySales = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: { $month: '$createdAt' }, revenue: { $sum: '$finalTotal' }, count: { $sum: 1 } } },
      { $sort: { '_id': 1 } },
    ]);

    res.json({
      success: true,
      data: { totalBooks, totalOrders, totalUsers, totalCategories, revenue, recentOrders, ordersByStatus, monthlySales },
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = {
  adminGetBooks, adminCreateBook, adminUpdateBook, adminDeleteBook,
  adminGetCategories, adminCreateCategory, adminUpdateCategory, adminDeleteCategory,
  adminGetOrders, adminUpdateOrderStatus,
  adminGetUsers, adminUpdateUserRole, adminToggleUser,
  adminGetStats,
};
