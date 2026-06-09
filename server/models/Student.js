const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  admissionNo: { type: String, required: true, unique: true },
  rollNo: { type: String, required: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  bloodGroup: String,
  class: { type: String, required: true }, // e.g. "Grade 10"
  section: { type: String, required: true }, // e.g. "Section A"
  admissionDate: { type: Date, default: Date.now },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent' },
  documents: [{
    name: String,
    url: String, // Cloudinary link
    uploadedAt: { type: Date, default: Date.now }
  }],
  status: { type: String, enum: ['Active', 'Transferred', 'Graduated', 'Suspended'], default: 'Active' }
}, { timestamps: true });

studentSchema.index({ branch: 1, admissionNo: 1 });
studentSchema.index({ branch: 1, class: 1, section: 1 });
module.exports = mongoose.model('Student', studentSchema);
