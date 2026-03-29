const express = require('express');
const router = express.Router();
const { createVNPayPayment, vnpayReturn, vnpayIPN } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// POST - Create VNPay payment URL
router.post('/vnpay-create', protect, createVNPayPayment);

// GET - VNPay return URL (redirect from VNPay)
router.get('/vnpay-return', vnpayReturn);

// GET - VNPay IPN (server to server callback)
router.get('/vnpay-ipn', vnpayIPN);

module.exports = router;
