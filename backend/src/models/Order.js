const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  title: { type: String, required: true },
  imageUrl: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderCode: { type: String, unique: true },
  items: [orderItemSchema],
  totalPrice: { type: Number, required: true },
  shippingFee: { type: Number, default: 30000 },
  finalTotal: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'],
    default: 'pending',
  },
  paymentMethod: { type: String, enum: ['cod', 'banking', 'vnpay'], default: 'cod' },
  paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
  vnpayTransactionId: { type: String, default: null },
  vnpayAmount: { type: Number, default: null },
  vnpayCreateDate: { type: Date, default: null },
  shippingAddress: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
  },
  note: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
