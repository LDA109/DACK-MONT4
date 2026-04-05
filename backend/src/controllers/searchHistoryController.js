const SearchHistory = require('../models/SearchHistory');

// POST - Lưu search (Create)
const saveSearchHistory = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Cần đăng nhập' });
    
    const { keyword, filters, resultsCount } = req.body;
    
    const search = await SearchHistory.create({
      user: req.user._id,
      keyword,
      filters: filters || {},
      resultsCount: resultsCount || 0
    });
    
    res.status(201).json({ success: true, data: search });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET - Lấy lịch sử (Read)
const getSearchHistory = async (req, res) => {
  try {
    const searches = await SearchHistory.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, data: searches });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE - Xóa 1 record (Đã fix lỗi Autho)
const deleteSearchRecord = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Autho: Kiểm tra xem record này có tồn tại VÀ có thuộc về user đang đăng nhập không
    const record = await SearchHistory.findOne({ _id: id, user: req.user._id });
    
    if (!record) {
        return res.status(403).json({ success: false, message: 'Không tìm thấy hoặc bạn không có quyền xóa bản ghi này!' });
    }

    await SearchHistory.findByIdAndDelete(id);
    res.json({ success: true, message: 'Đã xóa thành công' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE - Xóa toàn bộ
const clearSearchHistory = async (req, res) => {
  try {
    await SearchHistory.deleteMany({ user: req.user._id });
    res.json({ success: true, message: 'Đã xóa toàn bộ lịch sử' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = { saveSearchHistory, getSearchHistory, deleteSearchRecord, clearSearchHistory };