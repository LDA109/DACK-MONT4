const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Coupon = require('./src/models/Coupon');

dotenv.config();

const seedCoupon = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Xóa mã cũ nếu có
    await Coupon.deleteMany({ code: 'GIAM10' });

    const coupon = new Coupon({
      code: 'GIAM10',
      discountType: 'percentage',
      discountValue: 10,
      minOrderValue: 100000,
      maxDiscountAmount: 50000,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days later
      usageLimit: 100,
      usedCount: 0,
      isActive: true,
      description: 'Giảm 10% cho đơn hàng từ 100k'
    });

    await coupon.save();
    console.log('Coupon GIAM10 seeded successfully!');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedCoupon();
