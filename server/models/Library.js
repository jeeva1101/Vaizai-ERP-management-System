const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  title: { type: String, required: true },
  author: { type: String, required: true },
  isbn: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  available: { type: Number, required: true, default: 1 },
  rackNo: String
}, { timestamps: true });

module.exports = mongoose.model('Library', bookSchema);
