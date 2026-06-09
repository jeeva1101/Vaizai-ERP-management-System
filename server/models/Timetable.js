const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  class: { type: String, required: true },
  section: { type: String, required: true },
  dayOfWeek: { 
    type: String, 
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], 
    required: true 
  },
  periods: [{
    subject: { type: String, required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    startTime: { type: String, required: true }, // "09:00" format
    endTime: { type: String, required: true }, // "09:45" format
    roomNo: String
  }]
}, { timestamps: true });

timetableSchema.index({ branch: 1, class: 1, section: 1 });
module.exports = mongoose.model('Timetable', timetableSchema);
