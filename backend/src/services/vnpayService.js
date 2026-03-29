const crypto = require('crypto');

class VNPayService {
  constructor() {
    this.vnpayUrl = process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    this.tmnCode = process.env.VNP_TMN_CODE; // '8WHS32FS'
    this.secretKey = process.env.VNP_HASH_SECRET; // '7GAR34MDZQSHU5XMMHFUTJW9LFJARU7W'
  }

  // Helper: Sort object keys and encode values (Match vnpay_nodejs sample)
  sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
      }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
      sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
  }

  // Tạo URL thanh toán VNPay (V4 Reference Sync)
  createPaymentUrl(order, returnUrl, clientIp = '127.0.0.1') {
    let vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = this.tmnCode;
    vnp_Params['vnp_Amount'] = String(Math.floor(order.finalTotal * 100));
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = order.orderCode;
    vnp_Params['vnp_OrderInfo'] = 'Thanh toan cho ma GD:' + order.orderCode;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    
    // IP handling
    let finalIp = clientIp;
    if (finalIp === '127.0.0.1' || finalIp === '::1' || finalIp.includes('localhost')) {
      finalIp = '13.160.92.202';
    }
    vnp_Params['vnp_IpAddr'] = finalIp;
    
    const date = new Date();
    const createDate = String(date.getFullYear()) + 
      String(date.getMonth() + 1).padStart(2, '0') + 
      String(date.getDate()).padStart(2, '0') +
      String(date.getHours()).padStart(2, '0') +
      String(date.getMinutes()).padStart(2, '0') +
      String(date.getSeconds()).padStart(2, '0');
    
    vnp_Params['vnp_CreateDate'] = createDate;
    
    // 1. Sort and Encode (Important: encoded BEFORE signing)
    vnp_Params = this.sortObject(vnp_Params);
    
    // 2. Build SignData (Using encoded values)
    const signData = Object.keys(vnp_Params)
      .map(key => `${key}=${vnp_Params[key]}`)
      .join('&');

    console.log('[VNPay] V4 SignData:', signData);

    // 3. HMAC-SHA512
    const checksum = crypto
      .createHmac('sha512', this.secretKey)
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');

    console.log('[VNPay] V4 Checksum:', checksum);

    // 4. Build final URL (Params are already encoded in vnp_Params)
    const query = Object.keys(vnp_Params)
      .map(key => `${key}=${vnp_Params[key]}`)
      .join('&');

    const paymentUrl = `${this.vnpayUrl}?${query}&vnp_SecureHash=${checksum}`;
    
    console.log('[VNPay] V4 Payment URL created successfully');
    return paymentUrl;
  }

  // Verify callback từ VNPay (V4 Reference Sync)
  verifyCallback(query) {
    const vnp_SecureHash = query['vnp_SecureHash'];
    
    let vnp_Params = {};
    Object.keys(query).forEach(key => {
      if (key.startsWith('vnp_') && 
          key !== 'vnp_SecureHash' && 
          key !== 'vnp_SecureHashType' &&
          query[key] !== '' && 
          query[key] !== null) {
        vnp_Params[key] = query[key];
      }
    });

    // 1. Sort and Encode (Using raw query params as input)
    vnp_Params = this.sortObject(vnp_Params);
    
    // 2. SignData (Using encoded values)
    const signData = Object.keys(vnp_Params)
      .map(key => `${key}=${vnp_Params[key]}`)
      .join('&');

    console.log('[VNPay] V4 Verify - SignData:', signData);

    // 3. Checksum
    const checksum = crypto
      .createHmac('sha512', this.secretKey)
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');

    // Case-insensitive comparison is safer
    const isValid = checksum.toLowerCase() === vnp_SecureHash.toLowerCase();
    
    console.log('[VNPay] V4 Verify - Calculated hash:', checksum);
    console.log('[VNPay] V4 Verify - Expected hash:', vnp_SecureHash);
    console.log('[VNPay] V4 Verify - Match:', isValid);

    return {
      isValid,
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
