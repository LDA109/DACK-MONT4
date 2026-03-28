const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { adminAuth } = require('../middleware/adminAuth');
const {
  adminGetBooks, adminCreateBook, adminUpdateBook, adminDeleteBook,
  adminGetCategories, adminCreateCategory, adminUpdateCategory, adminDeleteCategory,
  adminGetOrders, adminUpdateOrderStatus,
  adminGetUsers, adminUpdateUserRole, adminToggleUser,
  adminGetStats,
} = require('../controllers/adminController');

router.use(protect, adminAuth);

// Stats
router.get('/stats', adminGetStats);

// Books
router.get('/books', adminGetBooks);
router.post('/books', adminCreateBook);
router.put('/books/:id', adminUpdateBook);
router.delete('/books/:id', adminDeleteBook);

// Categories
router.get('/categories', adminGetCategories);
router.post('/categories', adminCreateCategory);
router.put('/categories/:id', adminUpdateCategory);
router.delete('/categories/:id', adminDeleteCategory);

// Orders
router.get('/orders', adminGetOrders);
router.put('/orders/:id/status', adminUpdateOrderStatus);

// Users
router.get('/users', adminGetUsers);
router.put('/users/:id/role', adminUpdateUserRole);
router.put('/users/:id/toggle', adminToggleUser);

module.exports = router;
