const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  studentName: { type: String, required: true },
  parentName: { type: String, required: true },
  email: { type: String, lowercase: true },
  phone: { type: String, required: true },
  gradeApplied: { type: String, required: true },
  source: { type: String, enum: ['Website', 'Referral', 'WalkIn', 'SocialMedia', 'Other'], default: 'Website' },
  status: { type: String, enum: ['New', 'Contacted', 'FollowUp', 'Admitted', 'Closed'], default: 'New' },
  followUps: [{
    date: { type: Date, default: Date.now },
    notes: String,
    nextFollowUpDate: Date
  }],
  notes: String
}, { timestamps: true });

leadSchema.index({ branch: 1, status: 1 });
module.exports = mongoose.model('Lead', leadSchema);
