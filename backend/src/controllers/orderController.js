const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Book = require('../models/Book');

// @POST /api/orders
const createOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod = 'cod', note } = req.body;
    if (!shippingAddress?.fullName || !shippingAddress?.phone || !shippingAddress?.address) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ địa chỉ giao hàng.' });
    }
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.book');
    if (!cart || cart.items.length === 0) return res.status(400).json({ message: 'Giỏ hàng trống.' });

    const items = cart.items.map(item => ({
      book: item.book._id,
      title: item.book.title,
      imageUrl: item.book.imageUrl,
      quantity: item.quantity,
      price: item.price,
    }));
    const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const shippingFee = totalPrice >= 250000 ? 0 : 30000;
    const finalTotal = totalPrice + shippingFee;

    const order = await Order.create({
      user: req.user._id,
      items,
      totalPrice,
      shippingFee,
      finalTotal,
      shippingAddress,
      paymentMethod,
      note,
    });

    // Update sold count
    for (const item of cart.items) {
      await Book.findByIdAndUpdate(item.book._id, { $inc: { sold: item.quantity, stock: -item.quantity } });
    }
    // Clear cart
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    res.status(201).json({ success: true, message: 'Đặt hàng thành công!', data: order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/orders/my
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/orders/:id
const getOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @PUT /api/orders/:id/cancel
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
    if (!['pending'].includes(order.status)) {
      return res.status(400).json({ message: 'Chỉ có thể huỷ đơn hàng đang chờ xử lý.' });
    }
    order.status = 'cancelled';
    await order.save();
    // Restore stock
    for (const item of order.items) {
      await Book.findByIdAndUpdate(item.book, { $inc: { sold: -item.quantity, stock: item.quantity } });
    }
    res.json({ success: true, message: 'Đã huỷ đơn hàng.', data: order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createOrder, getMyOrders, getOrder, cancelOrder };
