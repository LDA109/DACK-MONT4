const UserPreferences = require('../models/UserPreferences');

// GET - Lấy preferences của user hiện tại
const getUserPreferences = async (req, res) => {
  try {
    let prefs = await UserPreferences.findOne({ user: req.user._id });
    
    // Nếu chưa có thì tạo mới bộ cài đặt mặc định
    if (!prefs) {
      prefs = await UserPreferences.create({ 
        user: req.user._id,
        theme: 'light',
        language: 'vi'
      });
    }
    
    res.json({ success: true, data: prefs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT - Cập nhật preferences
const updateUserPreferences = async (req, res) => {
  try {
    const prefs = await UserPreferences.findOneAndUpdate(
      { user: req.user._id },
      { ...req.body, updatedAt: Date.now() },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: prefs });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = { getUserPreferences, updateUserPreferences };