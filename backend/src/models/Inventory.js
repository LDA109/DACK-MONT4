const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true,
    unique: true,
  },
  totalStock: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  availableStock: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  reservedStock: {
    type: Number,
    default: 0,
    min: 0,
  },
  warehouseLocation: {
    type: String,
    default: '',
  },
  lastRestockDate: {
    type: Date,
    default: null,
  },
  restockThreshold: {
    type: Number,
    default: 10, // Alert when stock falls below this
  },
  supplier: {
    type: String,
    default: '',
  },
  unitCost: {
    type: Number,
    default: 0,
  },
  trackingHistory: [
    {
      action: { type: String, enum: ['restock', 'sold', 'reserved', 'returned', 'adjustment'], required: true },
      quantity: { type: Number, required: true },
      reason: { type: String, default: '' },
      date: { type: Date, default: Date.now },
      reference: { type: String, default: '' }, // order ID, return ID, etc
    },
  ],
}, { timestamps: true });

inventorySchema.virtual('needsRestock').get(function () {
  return this.availableStock <= this.restockThreshold;
});

module.exports = mongoose.model('Inventory', inventorySchema);
