const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  keyword: {
    type: String,
    required: true
  },
  filters: {
    category: String,
    priceMin: Number,
    priceMax: Number,
    author: String
  },
  resultsCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
    // Đã xóa dòng `index: true` ở đây để hết lỗi cảnh báo (Duplicate schema index)
  }
});

// Tự động xóa record sau 30 ngày (optional)
searchHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('SearchHistory', searchHistorySchema);