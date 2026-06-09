const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }, // Optional (empty for system-wide)
  recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Targeted users
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['Info', 'Warning', 'Alert', 'Broadcast'], default: 'Info' },
  deliveryChannel: [{ type: String, enum: ['InApp', 'Email', 'SMS', 'WhatsApp'] }],
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

notificationSchema.index({ recipients: 1, createdAt: -1 });
module.exports = mongoose.model('Notification', notificationSchema);
