const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  title: {
    type: String,
    trim: true,
    default: '',
  },
  comment: {
    type: String,
    trim: true,
    default: '',
    maxlength: 1000,
  },
  images: [
    {
      type: String,
    },
  ],
  verified: {
    type: Boolean,
    default: false, // true if user actually bought this book
  },
  helpful: {
    type: Number,
    default: 0, // number of people who found this helpful
  },
  unhelpful: {
    type: Number,
    default: 0,
  },
  replied: {
    type: Boolean,
    default: false,
  },
  adminReply: {
    comment: { type: String, default: '' },
    date: { type: Date, default: null },
  },
  isActive: {
    type: Boolean,
    default: true, // admin can hide reviews
  },
}, { timestamps: true });

// Compound index to prevent duplicate reviews
reviewSchema.index({ book: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
