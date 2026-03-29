const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  console.log('[AUTH] Token present:', !!token);
  if (!token) return res.status(401).json({ message: 'Không có quyền truy cập. Vui lòng đăng nhập.' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    console.log('[AUTH] ✅ User authenticated:', req.user?._id);
    if (!req.user) return res.status(401).json({ message: 'Token không hợp lệ.' });
    next();
  } catch (err) {
    console.error('[AUTH] ❌ Token error:', err.message);
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
};

module.exports = { protect };
