const express = require('express');
const router = express.Router();
const { 
  checkCoupon, 
  getAllCoupons, 
  createCoupon, 
  updateCoupon, 
  deleteCoupon 
} = require('../controllers/couponController');
const { protect } = require('../middleware/auth');
const { adminAuth } = require('../middleware/adminAuth');

// User routes
router.post('/check', protect, checkCoupon);

// Admin routes
router.get('/', protect, adminAuth, getAllCoupons);
router.post('/', protect, adminAuth, createCoupon);
router.put('/:id', protect, adminAuth, updateCoupon);
router.delete('/:id', protect, adminAuth, deleteCoupon);

module.exports = router;
