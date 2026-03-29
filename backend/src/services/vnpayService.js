const crypto = require('crypto');

class VNPayService {
  constructor() {
    this.vnpayUrl = process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    this.tmnCode = process.env.VNP_TMN_CODE; // '8WHS32FS'
    this.secretKey = process.env.VNP_HASH_SECRET; // 'U5Y0GSSFX7GWB7SXNCAJG3PG5KIRO7JH'
  }

  // Tạo URL thanh toán VNPay
  createPaymentUrl(order, returnUrl) {
    const vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = this.tmnCode;
    
    // Amount in VND (20 digits)
    vnp_Params['vnp_Amount'] = order.finalTotal * 100; // Convert VND to smallest unit
    
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = order.orderCode; // Order code as transaction ref
    vnp_Params['vnp_OrderInfo'] = `Payment for order ${order.orderCode}`;
    vnp_Params['vnp_OrderType'] = 'billpayment';
    vnp_Params['vnp_Locale'] = 'vn';
    
    // Return URL - VNPay sẽ redirect về đây
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    
    // IP address
    vnp_Params['vnp_IpAddr'] = '127.0.0.1';
    
    // Create date
    const date = new Date();
    const createDate = date.getFullYear() + 
      String(date.getMonth() + 1).padStart(2, '0') + 
      String(date.getDate()).padStart(2, '0') +
      String(date.getHours()).padStart(2, '0') +
      String(date.getMinutes()).padStart(2, '0') +
      String(date.getSeconds()).padStart(2, '0');
    
    vnp_Params['vnp_CreateDate'] = createDate;
    
    // Sort parameters
    const sortedParams = Object.keys(vnp_Params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = vnp_Params[key];
        return acc;
      }, {});

    // Create SignData
    const signData = Object.entries(sortedParams)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');

    // Create checksum
    const checksum = crypto
      .createHmac('sha512', this.secretKey)
      .update(signData)
      .digest('hex');

    vnp_Params['vnp_SecureHash'] = checksum;

    // Build payment URL
    const paymentUrl = 
      this.vnpayUrl + '?' + 
      Object.entries(vnp_Params)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');

    return paymentUrl;
  }

  // Verify callback từ VNPay
  verifyCallback(query) {
    // Lấy vnp_SecureHash từ query
    const vnp_SecureHash = query.vnp_SecureHash;
    
    // Tạo copy của query params (exclude vnp_SecureHash)
    const vnp_Params = {};
    Object.keys(query).forEach(key => {
      if (key !== 'vnp_SecureHash') {
        vnp_Params[key] = query[key];
      }
    });

    // Sort parameters
    const sortedParams = Object.keys(vnp_Params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = vnp_Params[key];
        return acc;
      }, {});

    // Create SignData
    const signData = Object.entries(sortedParams)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');

    // Create checksum to compare
    const checksum = crypto
      .createHmac('sha512', this.secretKey)
      .update(signData)
      .digest('hex');

    // Verify
    return {
      isValid: checksum === vnp_SecureHash,
      params: vnp_Params
    };
  }

  // Parse response from VNPay
  parseResponse(vnp_Params) {
    const responseCode = vnp_Params.vnp_ResponseCode;
    const transactionNo = vnp_Params.vnp_TransactionNo;
    const txnRef = vnp_Params.vnp_TxnRef;
    const amount = vnp_Params.vnp_Amount / 100; // Convert back to VND

    return {
      success: responseCode === '00',
      responseCode,
      message: this.getResponseMessage(responseCode),
      transactionNo,
      txnRef, // Order code
      amount,
      bankCode: vnp_Params.vnp_BankCode || null,
      bankTranNo: vnp_Params.vnp_BankTranNo || null,
      cardType: vnp_Params.vnp_CardType || null
    };
  }

  getResponseMessage(code) {
    const messages = {
      '00': 'Giao dịch thành công',
      '01': 'Giao dịch bị từ chối',
      '02': 'Giao dịch bị lỗi',
      '04': 'Giao dịch đã được hủy',
      '05': 'Giao dịch bị từ chối (không đủ tiền)',
      '06': 'Giao dịch bị từ chối (sai mã)',
      '07': 'Giao dịch bị từ chối (thời gian hết hạn)',
      '09': 'Giao dịch bị từ chối (đơi tác không hỗ trợ)',
      '99': 'Các lỗi khác'
    };
    return messages[code] || 'Lỗi không xác định';
  }
}

module.exports = new VNPayService();
