const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  domain: { type: String, sparse: true }, // Custom domain mapping for SaaS
  logo: { type: String }, // Cloudinary URL
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'India' }
  },
  contact: {
    email: { type: String, required: true },
    phone: { type: String, required: true },
    website: String
  },
  settings: {
    academicYearStart: { type: Date, required: true },
    academicYearEnd: { type: Date, required: true },
    currency: { type: String, default: 'INR' },
    timezone: { type: String, default: 'Asia/Kolkata' }
  },
  isActive: { type: Boolean, default: true },
  metadata: { type: Map, of: String }
}, { timestamps: true });

module.exports = mongoose.model('Branch', branchSchema);

