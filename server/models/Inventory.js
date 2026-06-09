const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  itemName: { type: String, required: true },
  category: { type: String, required: true }, // e.g. "Lab Equipment", "Stationery"
  quantity: { type: Number, required: true, default: 0 },
  unit: { type: String, required: true }, // e.g. "pcs", "boxes"
  minStockThreshold: { type: Number, default: 5 },
  status: { type: String, enum: ['InStock', 'LowStock', 'OutOfStock'], default: 'InStock' }
}, { timestamps: true });

module.exports = mongoose.model('Inventory', itemSchema);
