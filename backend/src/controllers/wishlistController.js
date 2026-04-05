const Wishlist = require("../models/Wishlist");

// 1. Xem danh sách yêu thích
const getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id }).populate(
      "books",
    );
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, books: [] });
    }
    res.json({ success: true, data: wishlist });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 2. Bấm "Thả tim" (Thêm sách)
const addToWishlist = async (req, res) => {
  try {
    const { bookId } = req.body;
    let wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, books: [bookId] });
    } else if (!wishlist.books.includes(bookId)) {
      wishlist.books.push(bookId);
      await wishlist.save();
    }

    res.json({ success: true, data: wishlist });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// 3. Bỏ "Thả tim" (Xóa sách)
const removeFromWishlist = async (req, res) => {
  try {
    const { bookId } = req.params;
    const wishlist = await Wishlist.findOneAndUpdate(
      { user: req.user._id },
      { $pull: { books: bookId } },
      { new: true },
    ).populate("books");

    res.json({ success: true, data: wishlist });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
