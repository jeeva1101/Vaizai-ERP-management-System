const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  marksObtained: [{
    subject: { type: String, required: true },
    marks: { type: Number, required: true },
    remarks: String
  }],
  grade: String,
  percentage: Number,
  isPublished: { type: Boolean, default: false }
}, { timestamps: true });

resultSchema.index({ branch: 1, student: 1, exam: 1 }, { unique: true });
module.exports = mongoose.model('Result', resultSchema);
