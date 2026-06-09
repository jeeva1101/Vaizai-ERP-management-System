const mongoose = require('mongoose');

const hostelSchema = new mongoose.Schema({
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  name: { type: String, required: true }, // e.g. "Boys Hostel A"
  type: { type: String, enum: ['Boys', 'Girls', 'CoEd'], required: true },
  rooms: [{
    roomNo: { type: String, required: true },
    capacity: { type: Number, required: true },
    filled: { type: Number, default: 0 },
    monthlyRent: { type: Number, required: true }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Hostel', hostelSchema);
