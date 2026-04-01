const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

// @POST /api/ai/chat
// Đưa về middleware protect nếu chỉ muốn user đăng nhập mới chat được
// Ở đây mình cho phép tất cả mọi người (khách) chat để tăng trải nghiệm.
router.post('/chat', aiController.chatWithAI);

module.exports = router;
