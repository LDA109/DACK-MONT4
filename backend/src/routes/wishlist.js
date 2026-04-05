const express = require("express");
const router = express.Router();

// 1. Import các hàm xử lý từ Controller
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} = require("../controllers/wishlistController");

// 2. Import middleware auth thật của nhóm
const { protect } = require("../middleware/auth");

// 3. Định nghĩa các Route chính thức
// Lấy danh sách yêu thích
router.get("/", protect, getWishlist);

// Thêm sách vào danh sách
router.post("/add", protect, addToWishlist);

// Xóa sách khỏi danh sách
router.delete("/remove/:bookId", protect, removeFromWishlist);

module.exports = router;
