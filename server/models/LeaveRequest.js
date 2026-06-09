const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  leaveType: { type: String, enum: ['Sick', 'Casual', 'Earned', 'Maternity', 'Unpaid'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  comments: String
}, { timestamps: true });

leaveRequestSchema.index({ branch: 1, employee: 1 });
module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
