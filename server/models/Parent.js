const mongoose = require('mongoose');

const parentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  relationship: { type: String, enum: ['Father', 'Mother', 'Guardian'], required: true },
  phone: { type: String, required: true },
  alternatePhone: String,
  occupation: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }]
}, { timestamps: true });

parentSchema.index({ branch: 1 });
module.exports = mongoose.model('Parent', parentSchema);
