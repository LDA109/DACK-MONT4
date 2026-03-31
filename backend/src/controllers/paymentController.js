const Order = require('../models/Order');
const vnpayService = require('../services/vnpayService');
const Coupon = require('../models/Coupon');

// @POST /api/payment/vnpay-create
// Tạo URL thanh toán VNPay
const createVNPayPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    console.log('[VNPay] Payment request:', { orderId, userId: req.user?._id });

    if (!orderId) {
      console.warn('[VNPay] Missing orderId');
      return res.status(400).json({ success: false, message: 'Order ID không được để trống' });
    }

    // Kiếm order
    const order = await Order.findById(orderId);
    if (!order) {
      console.warn('[VNPay] Order not found:', orderId);
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    console.log('[VNPay] Order found:', { orderCode: order.orderCode, paymentMethod: order.paymentMethod });

    // Kiểm tra order belong to user
    if (order.user.toString() !== req.user._id.toString()) {
      console.warn('[VNPay] Unauthorized access to order:', { orderId, userId: req.user._id, orderUserId: order.user });
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập đơn hàng này' });
    }

    // Kiểm tra payment method
    if (order.paymentMethod !== 'vnpay') {
      console.warn('[VNPay] Wrong payment method:', { orderId, method: order.paymentMethod });
      return res.status(400).json({ success: false, message: 'Đơn hàng này không sử dụng VNPay' });
    }

    // Tạo return URL
    const returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/vnpay-return`;
    
    // Lấy client IP address - convert IPv6 localhost to IPv4
    let clientIp = req.ip || req.connection.remoteAddress || '127.0.0.1';
    // Convert IPv6 localhost (::1) to IPv4 (127.0.0.1)
    if (clientIp === '::1' || clientIp === '::ffff:127.0.0.1') {
      clientIp = '127.0.0.1';
    }
    
    console.log('[VNPay] Return URL:', returnUrl);
    console.log('[VNPay] Client IP:', clientIp);
    console.log('[VNPay] VNPay config:', { 
      tmnCode: process.env.VNP_TMN_CODE ? 'SET' : 'NOT SET',
      secretKey: process.env.VNP_HASH_SECRET ? 'SET' : 'NOT SET',
      url: process.env.VNPAY_URL ? 'SET' : 'NOT SET'
    });

    // Tạo payment URL từ VNPayService
    let paymentUrl;
    try {
      paymentUrl = vnpayService.createPaymentUrl(order, returnUrl, clientIp);
      console.log('[VNPay] Payment URL created successfully');
    } catch (serviceErr) {
      console.error('[VNPay] vnpayService.createPaymentUrl() error:', serviceErr.message, serviceErr.stack);
      throw new Error(`VNPay service error: ${serviceErr.message}`);
    }

    res.json({
      success: true,
      message: 'Tạo URL thanh toán thành công',
      data: {
        paymentUrl,
        orderCode: order.orderCode,
        amount: order.finalTotal
      }
    });
  } catch (err) {
    console.error('[VNPay] ERROR in createVNPayPayment:', {
      message: err.message,
      stack: err.stack,
      userId: req.user?._id
    });
    res.status(500).json({ 
      success: false, 
      message: err.message || 'Lỗi server khi tạo URL thanh toán VNPay' 
    });
  }
};

// @GET /api/payment/vnpay-return
// Xử lý callback return từ VNPay
const vnpayReturn = async (req, res) => {
  try {
    // Verify signature từ VNPay
    const verifyResult = vnpayService.verifyCallback(req.query);

    if (!verifyResult.isValid) {
      console.error('[VNPay] V4 Signature verification failed');
      return res.status(400).json({
        success: false,
        message: 'Chữ ký không hợp lệ'
      });
    }

    console.log('[VNPay] V4 Signature verified successfully');

    // Parse response
    const response = vnpayService.parseResponse(verifyResult.params);

    // Tìm order by orderCode (txnRef)
    const order = await Order.findOne({ orderCode: response.txnRef });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    // Kiểm tra amount (chuyển về integer để so sánh chính xác)
    const vnpAmount = Math.round(response.amount);
    if (vnpAmount !== order.finalTotal) {
      console.warn('[VNPay] V4 Amount mismatch:', { 
        vnpAmount, 
        orderAmount: order.finalTotal,
        orderCode: order.orderCode
      });
      return res.status(400).json({
        success: false,
        message: 'Số tiền không khớp'
      });
    }

    // Cập nhật order nếu thanh toán thành công
    if (response.success) {
      order.paymentStatus = 'paid';
      order.vnpayTransactionId = response.transactionNo;
      order.vnpayAmount = response.amount;
      order.vnpayCreateDate = new Date();
      await order.save();

      // Tăng usedCount của coupon nếu có
      if (order.appliedCoupon) {
        await Coupon.findOneAndUpdate({ code: order.appliedCoupon }, { $inc: { usedCount: 1 } });
      }

      return res.json({
        success: true,
        message: 'Thanh toán thành công',
        data: {
          orderCode: order.orderCode,
          amount: order.finalTotal,
          transactionNo: response.transactionNo
        }
      });
    } else {
      return res.json({
        success: false,
        message: response.message || 'Thanh toán thất bại',
        data: {
          orderCode: order.orderCode,
          responseCode: response.responseCode
        }
      });
    }
  } catch (err) {
    console.error('Error in VNPay return:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// @POST /api/payment/vnpay-ipn
// IPN callback từ VNPay (server-to-server)
const vnpayIPN = async (req, res) => {
  try {
    // Verify signature từ VNPay
    const verifyResult = vnpayService.verifyCallback(req.query);

    if (!verifyResult.isValid) {
      console.error('[VNPay] V4 IPN Signature verification failed');
      return res.json({
        RspCode: '97',
        Message: 'Fail checksum'
      });
    }

    // Parse response
    const response = vnpayService.parseResponse(verifyResult.params);

    // Tìm order by orderCode (txnRef)
    const order = await Order.findOne({ orderCode: response.txnRef });

    if (!order) {
      return res.json({
        RspCode: '01',
        Message: 'Order not found'
      });
    }

    // Kiểm tra amount
    const vnpAmount = Math.round(response.amount);
    if (vnpAmount !== order.finalTotal) {
      console.warn('[VNPay] V4 IPN Amount mismatch:', { vnpAmount, orderAmount: order.finalTotal });
      return res.json({
        RspCode: '04',
        Message: 'Amount mismatch'
      });
    }

    // Cập nhật order nếu thanh toán thành công
    if (response.success && order.paymentStatus !== 'paid') {
      order.paymentStatus = 'paid';
      order.vnpayTransactionId = response.transactionNo;
      order.vnpayAmount = response.amount;
      order.vnpayCreateDate = new Date();
      await order.save();

      // Tăng usedCount của coupon nếu có
      if (order.appliedCoupon) {
        await Coupon.findOneAndUpdate({ code: order.appliedCoupon }, { $inc: { usedCount: 1 } });
      }
    }

    // VNPay yêu cầu response này
    return res.json({
      RspCode: '00',
      Message: 'Confirm received'
    });
  } catch (err) {
    console.error('Error in VNPay IPN:', err);
    res.json({
      RspCode: '99',
      Message: 'Server error'
    });
  }
};

module.exports = {
  createVNPayPayment,
  vnpayReturn,
  vnpayIPN
};
