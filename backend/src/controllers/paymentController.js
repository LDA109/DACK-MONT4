const Order = require('../models/Order');
const vnpayService = require('../services/vnpayService');

// @POST /api/payment/vnpay-create
// Tạo URL thanh toán VNPay
const createVNPayPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: 'Order ID không được để trống' });
    }

    // Kiếm order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    // Kiểm tra order belong to user
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Không có quyền truy cập đơn hàng này' });
    }

    // Kiểm tra payment method
    if (order.paymentMethod !== 'vnpay') {
      return res.status(400).json({ message: 'Đơn hàng này không sử dụng VNPay' });
    }

    // Tạo return URL
    const returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/vnpay-return`;

    // Tạo payment URL từ VNPayService
    const paymentUrl = vnpayService.createPaymentUrl(order, returnUrl);

    res.json({
      success: true,
      data: {
        paymentUrl,
        orderCode: order.orderCode,
        amount: order.finalTotal
      }
    });
  } catch (err) {
    console.error('Error creating VNPay payment:', err);
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/payment/vnpay-return
// Xử lý callback return từ VNPay
const vnpayReturn = async (req, res) => {
  try {
    // Verify signature từ VNPay
    const verifyResult = vnpayService.verifyCallback(req.query);

    if (!verifyResult.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Chữ ký không hợp lệ'
      });
    }

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

    // Kiểm tra amount
    if (parseInt(response.amount) !== order.finalTotal) {
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
    if (parseInt(response.amount) !== order.finalTotal) {
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
