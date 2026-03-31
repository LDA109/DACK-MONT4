const Coupon = require('../models/Coupon');
const Cart = require('../models/Cart');

// @POST /api/coupons/check
// Public/User
const checkCoupon = async (req, res) => {
  try {
    const { code, totalPrice } = req.body;
    
    if (!code) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập mã giảm giá.' });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Mã giảm giá không tồn tại hoặc đã hết hiệu lực.' });
    }

    const now = new Date();
    if (now < coupon.startDate) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá chưa đến thời gian sử dụng.' });
    }
    if (now > coupon.endDate) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết hạn.' });
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết lượt sử dụng.' });
    }

    if (totalPrice < coupon.minOrderValue) {
      return res.status(400).json({ 
        success: false, 
        message: `Đơn hàng tối thiểu ${coupon.minOrderValue.toLocaleString()}đ mới có thể áp dụng mã này.` 
      });
    }

    let discountAmount = 0;
    if (coupon.discountType === 'fixed') {
      discountAmount = coupon.discountValue;
    } else if (coupon.discountType === 'percentage') {
      discountAmount = (totalPrice * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    }

    // Đảm bảo số tiền giảm không vượt quá tổng tiền
    if (discountAmount > totalPrice) {
      discountAmount = totalPrice;
    }

    res.json({
      success: true,
      message: 'Áp dụng mã giảm giá thành công!',
      data: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: Math.round(discountAmount)
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin Controllers
const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, data: coupons });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createCoupon = async (req, res) => {
  try {
    const newCoupon = new Coupon(req.body);
    await newCoupon.save();
    res.status(201).json({ success: true, message: 'Tạo mã giảm giá thành công!', data: newCoupon });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!coupon) return res.status(404).json({ success: false, message: 'Không tìm thấy mã.' });
    res.json({ success: true, message: 'Cập nhật thành công!', data: coupon });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Không tìm thấy mã.' });
    res.json({ success: true, message: 'Đã xóa mã giảm giá.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  checkCoupon,
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon
};
