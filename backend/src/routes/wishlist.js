const express = require("express");
const auth = require("../middleware/auth"); // Dùng lại auth thật của nhóm
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} = require("../controllers/wishlistController");

const router = express.Router();

/* Tạm khóa mockAuth để nhóm dùng auth thật
const mockAuth = (req, res, next) => {
  req.user = { _id: "65f01234abcd5678ef901234" }; 
  next();
};
*/

// Lắp lại auth thật vào các route
router.get("/", auth, getWishlist);
router.post("/add", auth, addToWishlist);
router.delete("/remove/:bookId", auth, removeFromWishlist);

module.exports = router;
