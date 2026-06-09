const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  email: String,
  role: String,
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  action: { type: String, required: true }, // e.g. "CREATE_STUDENT", "FEE_PAYMENT"
  entity: { type: String, required: true }, // e.g. "Student", "Payment"
  entityId: mongoose.Schema.Types.ObjectId,
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed
  },
  ipAddress: String,
  userAgent: String
}, { timestamps: true });

auditLogSchema.index({ branch: 1, createdAt: -1 });
module.exports = mongoose.model('AuditLog', auditLogSchema);
