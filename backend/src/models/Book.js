const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  author: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true },
  originalPrice: { type: Number, required: true },
  discount: { type: Number, default: 0 }, // percentage 0-100
  imageUrl: { type: String, default: '' },
  images: [{ type: String }],
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  categoryName: { type: String },
  publisher: { type: String, default: '' },
  publishYear: { type: Number },
  type: { type: String, enum: ['book', 'manga'], default: 'book' },
  volume: { type: Number, default: null }, // for manga series
  seriesName: { type: String, default: '' },
  stock: { type: Number, default: 100 },
  sold: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  isFlashSale: { type: Boolean, default: false },
  isBestseller: { type: Boolean, default: false },
  isTrending: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  tags: [{ type: String }],
  lang: { type: String, default: 'vi' },
  pages: { type: Number, default: 0 },
  weight: { type: Number, default: 0 }, // grams
  size: { type: String, default: '' },
}, { timestamps: true });

bookSchema.index({ title: 'text', author: 'text', tags: 'text' });

module.exports = mongoose.model('Book', bookSchema);
