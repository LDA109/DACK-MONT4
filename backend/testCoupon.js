const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Coupon = require('./src/models/Coupon');
const { checkCoupon } = require('./src/controllers/couponController');

dotenv.config();

const testLogic = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('--- TEST LOGIC COUPON ---');

    // Case 1: Valid calculation
    const req = {
      body: { code: 'GIAM10', totalPrice: 200000 }
    };
    const res = {
      status: (code) => ({ json: (data) => console.log(`Status ${code}:`, data) }),
      json: (data) => console.log('Response JSON:', data)
    };

    await checkCoupon(req, res);

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

testLogic();
