const Cart = require('../models/Cart');
const Book = require('../models/Book');

// @GET /api/cart
const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.book', 'title imageUrl price stock isActive');
    if (!cart) return res.json({ success: true, data: { items: [], totalPrice: 0, totalItems: 0 } });
    const totalPrice = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    res.json({ success: true, data: { ...cart.toObject(), totalPrice, totalItems } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @POST /api/cart/add
const addToCart = async (req, res) => {
  try {
    const { bookId, quantity = 1 } = req.body;
    const book = await Book.findById(bookId);
    if (!book || !book.isActive) return res.status(404).json({ message: 'Sách không tồn tại.' });
    if (book.stock < quantity) return res.status(400).json({ message: 'Không đủ hàng trong kho.' });

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = new Cart({ user: req.user._id, items: [] });

    const existingIdx = cart.items.findIndex(i => i.book.toString() === bookId);
    if (existingIdx >= 0) {
      cart.items[existingIdx].quantity += quantity;
    } else {
      cart.items.push({ book: bookId, quantity, price: book.price });
    }
    await cart.save();
    const populated = await Cart.findById(cart._id).populate('items.book', 'title imageUrl price stock');
    const totalPrice = populated.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalItems = populated.items.reduce((sum, item) => sum + item.quantity, 0);
    res.json({ success: true, message: 'Đã thêm vào giỏ hàng!', data: { ...populated.toObject(), totalPrice, totalItems } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @PUT /api/cart/update
const updateCart = async (req, res) => {
  try {
    const { bookId, quantity } = req.body;
    if (quantity < 1) return res.status(400).json({ message: 'Số lượng phải lớn hơn 0.' });
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Giỏ hàng trống.' });
    const idx = cart.items.findIndex(i => i.book.toString() === bookId);
    if (idx < 0) return res.status(404).json({ message: 'Sách không có trong giỏ.' });
    cart.items[idx].quantity = quantity;
    await cart.save();
    const populated = await Cart.findById(cart._id).populate('items.book', 'title imageUrl price stock');
    const totalPrice = populated.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalItems = populated.items.reduce((sum, item) => sum + item.quantity, 0);
    res.json({ success: true, data: { ...populated.toObject(), totalPrice, totalItems } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @DELETE /api/cart/remove/:bookId
const removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Giỏ hàng trống.' });
    cart.items = cart.items.filter(i => i.book.toString() !== req.params.bookId);
    await cart.save();
    const populated = await Cart.findById(cart._id).populate('items.book', 'title imageUrl price stock');
    const totalPrice = populated.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalItems = populated.items.reduce((sum, item) => sum + item.quantity, 0);
    res.json({ success: true, message: 'Đã xóa khỏi giỏ hàng.', data: { ...populated.toObject(), totalPrice, totalItems } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @DELETE /api/cart/clear
const clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
    res.json({ success: true, message: 'Đã xóa toàn bộ giỏ hàng.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getCart, addToCart, updateCart, removeFromCart, clearCart };
