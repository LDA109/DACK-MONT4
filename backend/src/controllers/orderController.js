const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Book = require('../models/Book');
const Coupon = require('../models/Coupon');

// @POST /api/orders
const createOrder = async (req, res) => {
  try {
    console.log('[ORDER] 📝 Received createOrder request');
    console.log('[ORDER] User ID:', req.user?._id);
    console.log('[ORDER] Request body:', req.body);

    const { shippingAddress, paymentMethod = 'cod', note, couponCode } = req.body;
    if (!shippingAddress?.fullName || !shippingAddress?.phone || !shippingAddress?.address) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ địa chỉ giao hàng.' });
    }
    console.log('[ORDER] ✅ Address validation passed');
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.book');
    console.log('[ORDER] 🛒 Cart found:', cart ? 'Yes' : 'No');
    if (!cart || cart.items.length === 0) return res.status(400).json({ message: 'Giỏ hàng trống.' });

    const items = cart.items.map(item => ({
      book: item.book._id,
      title: item.book.title,
      imageUrl: item.book.imageUrl,
      quantity: item.quantity,
      price: item.price,
    }));
    console.log('[ORDER] 📦 Items mapped:', items.length);
    const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    
    // Xử lý Coupon
    let discountAmount = 0;
    let appliedCoupon = null;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon) {
        const now = new Date();
        if (now >= coupon.startDate && now <= coupon.endDate && 
           (coupon.usageLimit === null || coupon.usedCount < coupon.usageLimit) &&
           totalPrice >= coupon.minOrderValue) {
          
          if (coupon.discountType === 'fixed') {
            discountAmount = coupon.discountValue;
          } else if (coupon.discountType === 'percentage') {
            discountAmount = (totalPrice * coupon.discountValue) / 100;
            if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
              discountAmount = coupon.maxDiscountAmount;
            }
          }
          if (discountAmount > totalPrice) discountAmount = totalPrice;
          appliedCoupon = coupon.code;
        }
      }
    }

    const shippingFee = totalPrice >= 250000 ? 0 : 30000;
    const finalTotal = Math.max(0, totalPrice - discountAmount + shippingFee);
    console.log('[ORDER] 💰 Total:', finalTotal, 'Discount:', discountAmount, 'Payment method:', paymentMethod);
    
    // Generate unique order code
    const orderCode = 'ORD' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase();

    const order = await Order.create({
      user: req.user._id,
      orderCode,
      items,
      totalPrice,
      shippingFee,
      discountAmount,
      appliedCoupon,
      finalTotal,
      shippingAddress,
      paymentMethod,
      note,
    });
    console.log('[ORDER] ✅ Order created:', order._id);

    // Update sold count
    for (const item of cart.items) {
      await Book.findByIdAndUpdate(item.book._id, { $inc: { sold: item.quantity, stock: -item.quantity } });
    }

    // Nếu thanh toán COD or Banking (không qua VNPay), tăng usedCount của coupon luôn
    if (paymentMethod !== 'vnpay' && appliedCoupon) {
      await Coupon.findOneAndUpdate({ code: appliedCoupon }, { $inc: { usedCount: 1 } });
    }

    // Clear cart
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    res.status(201).json({ success: true, message: 'Đặt hàng thành công!', data: order });
  } catch (err) {
    console.error('[ORDER] ❌ ERROR:', err.message);
    console.error('[ORDER] Stack:', err.stack);
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
