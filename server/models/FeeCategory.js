const mongoose = require('mongoose');

const feeCategorySchema = new mongoose.Schema({
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  name: { type: String, required: true }, // e.g., "Tuition Fee", "Bus Fee"
  description: String,
  amount: { type: Number, required: true },
  frequency: { type: String, enum: ['OneTime', 'Monthly', 'Quarterly', 'Annual'], required: true }
}, { timestamps: true });

feeCategorySchema.index({ branch: 1, name: 1 });
module.exports = mongoose.model('FeeCategory', feeCategorySchema);
