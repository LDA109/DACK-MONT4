const express = require('express');
const router = express.Router();

// 1. Lấy toàn bộ object middleware ra
const authMiddleware = require('../middleware/auth'); 
const userPrefController = require('../controllers/userPreferencesController');

// 2. Tìm đúng hàm bảo mật (auth hoặc protect) từ object của Leader
const protect = authMiddleware.auth || authMiddleware.protect || authMiddleware;

// 3. Định nghĩa các đường dẫn
router.get('/', protect, userPrefController.getUserPreferences);
router.put('/', protect, userPrefController.updateUserPreferences);

module.exports = router;