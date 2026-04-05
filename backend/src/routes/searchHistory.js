const express = require('express');
// Import đúng tên hàm protect từ file auth.js của nhóm
const { protect } = require('../middleware/auth'); 
const {
  saveSearchHistory,
  getSearchHistory,
  deleteSearchRecord,
  clearSearchHistory
} = require('../controllers/searchHistoryController');

const router = express.Router();

// Gắn middleware protect vào trước các controller
router.post('/', protect, saveSearchHistory);
router.get('/', protect, getSearchHistory);
router.delete('/:id', protect, deleteSearchRecord);
router.delete('/', protect, clearSearchHistory);

module.exports = router;