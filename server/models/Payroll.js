const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  month: { type: Number, required: true }, // 1 to 12
  year: { type: Number, required: true },
  basicSalary: { type: Number, required: true },
  allowancesTotal: { type: Number, default: 0 },
  deductionsTotal: { type: Number, default: 0 },
  netSalary: { type: Number, required: true },
  status: { type: String, enum: ['Draft', 'Processed', 'Paid'], default: 'Draft' },
  paymentDate: Date,
  paymentMethod: { type: String, enum: ['BankTransfer', 'Cash', 'Cheque'] },
  payslipUrl: String // Generated PDF URL
}, { timestamps: true });

payrollSchema.index({ branch: 1, employee: 1, month: 1, year: 1 }, { unique: true });
module.exports = mongoose.model('Payroll', payrollSchema);
