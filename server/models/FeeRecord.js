const mongoose = require('mongoose');

const feeRecordSchema = new mongoose.Schema({
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  feeCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeCategory', required: true },
  dueDate: { type: Date, required: true },
  amount: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  fine: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  status: { type: String, enum: ['Unpaid', 'PartiallyPaid', 'Paid'], default: 'Unpaid' }
}, { timestamps: true });

feeRecordSchema.index({ branch: 1, student: 1 });
module.exports = mongoose.model('FeeRecord', feeRecordSchema);
