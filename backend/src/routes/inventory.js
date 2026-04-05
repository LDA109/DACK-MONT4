const express = require('express');
const {
  getInventory,
  getInventoryByBook,
  createInventory,
  updateInventory,
  adjustStock,
  deleteInventory,
  seedInventory,
} = require('../controllers/inventoryController');
const { protect } = require('../middleware/auth');
const { adminAuth } = require('../middleware/adminAuth');

const router = express.Router();

// Admin only routes (SPECIFIC routes trước)
router.post('/seed/auto', protect, adminAuth, seedInventory);

// Public routes (GENERIC routes sau)
router.get('/', getInventory);
router.get('/book/:id', getInventoryByBook);

// Admin CRUD routes
router.post('/', protect, adminAuth, createInventory);
router.put('/:id', protect, adminAuth, updateInventory);
router.put('/:id/adjust', protect, adminAuth, adjustStock);
router.delete('/:id', protect, adminAuth, deleteInventory);

module.exports = router;
