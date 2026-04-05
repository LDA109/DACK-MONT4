const mongoose = require('mongoose');

const userPreferencesSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // 🎨 Giao diện
  theme: {
    type: String,
    enum: ['light', 'dark', 'auto'],
    default: 'light'
  },
  language: {
    type: String,
    enum: ['vi', 'en'],
    default: 'vi'
  },
  
  // 📧 Email Notifications
  emailNotifications: {
    orderStatus: { type: Boolean, default: true },
    promotions: { type: Boolean, default: true },
    newArrivals: { type: Boolean, default: false },
    recommendations: { type: Boolean, default: true }
  },
  
  // 💱 Tùy chọn khác
  currency: {
    type: String,
    enum: ['VND', 'USD', 'EUR'],
    default: 'VND'
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserPreferences', userPreferencesSchema);