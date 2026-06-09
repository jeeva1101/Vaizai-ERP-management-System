const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  name: { type: String, required: true }, // e.g. "First Term Exams"
  class: { type: String, required: true },
  term: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  schedules: [{
    subject: { type: String, required: true },
    date: { type: Date, required: true },
    durationMinutes: Number,
    maxMarks: { type: Number, default: 100 },
    passingMarks: { type: Number, default: 35 }
  }]
}, { timestamps: true });

examSchema.index({ branch: 1, class: 1 });
module.exports = mongoose.model('Exam', examSchema);
