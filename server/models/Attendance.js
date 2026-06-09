const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' }, // Set if student attendance
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }, // Set if staff attendance
  date: { type: Date, required: true },
  status: { type: String, enum: ['Present', 'Absent', 'Late', 'HalfDay'], required: true },
  remarks: String,
  lateMinutes: { type: Number, default: 0 }
}, { timestamps: true });

attendanceSchema.index({ branch: 1, student: 1, date: 1 });
attendanceSchema.index({ branch: 1, employee: 1, date: 1 });
module.exports = mongoose.model('Attendance', attendanceSchema);
