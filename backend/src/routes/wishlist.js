const express = require("express");
const router = express.Router();

// 1. Import các hàm xử lý từ Controller
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} = require("../controllers/wishlistController");

// 2. Import middleware auth thật của nhóm
// Lưu ý: Nếu server báo lỗi [object Object], hãy đổi thành: const { auth } = require(...);
const auth = require("../middleware/auth");

// 3. Định nghĩa các Route chính thức
// Lấy danh sách yêu thích
router.get("/", auth, getWishlist);

// Thêm sách vào danh sách
router.post("/add", auth, addToWishlist);

// Xóa sách khỏi danh sách
router.delete("/remove/:bookId", auth, removeFromWishlist);

module.exports = router;
