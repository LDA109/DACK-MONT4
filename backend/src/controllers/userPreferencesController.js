const UserPreferences = require('../models/UserPreferences');

// GET - Lấy preferences của user hiện tại
const getUserPreferences = async (req, res) => {
    try {
        // Lưu ý: Dùng req.user._id hoặc req.user.id tùy theo Middleware của nhóm
        const userId = req.user._id || req.user.id;
        
        let prefs = await UserPreferences.findOne({ user: userId });
        
        // Nếu chưa có thì tạo mới bộ cài đặt mặc định
        if (!prefs) {
            prefs = await UserPreferences.create({ 
                user: userId,
                theme: 'light',
                language: 'vi'
            });
        }
        
        res.json({ success: true, data: prefs });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PUT - Cập nhật preferences
const updateUserPreferences = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        
        const prefs = await UserPreferences.findOneAndUpdate(
            { user: userId },
            { ...req.body, updatedAt: Date.now() },
            { new: true, upsert: true }
        );
        res.json({ success: true, data: prefs });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// Export dạng object để file Route nhận diện được
module.exports = { 
    getUserPreferences, 
    updateUserPreferences 
};