const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  feeRecord: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeRecord', required: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['Online', 'Cash', 'Cheque', 'BankTransfer'], required: true },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  transactionStatus: { type: String, enum: ['Pending', 'Completed', 'Failed'], default: 'Pending' },
  transactionDate: { type: Date, default: Date.now },
  receiptNo: { type: String, unique: true }
}, { timestamps: true });

paymentSchema.index({ branch: 1, receiptNo: 1 });
module.exports = mongoose.model('Payment', paymentSchema);
