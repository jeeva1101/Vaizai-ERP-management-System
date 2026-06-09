const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  employeeId: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String, required: true },
  joiningDate: { type: Date, required: true },
  department: { type: String, required: true }, // e.g. "Academics", "Administration", "Finance"
  designation: { type: String, required: true }, // e.g. "Senior Teacher", "HR Manager", "Accountant"
  salaryStructure: {
    basicSalary: { type: Number, required: true },
    allowances: [{ name: String, amount: Number }],
    deductions: [{ name: String, amount: Number }]
  },
  documents: [{
    name: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  status: { type: String, enum: ['Active', 'Resigned', 'Terminated', 'OnLeave'], default: 'Active' }
}, { timestamps: true });

employeeSchema.index({ branch: 1, employeeId: 1 });
employeeSchema.index({ branch: 1, department: 1 });
module.exports = mongoose.model('Employee', employeeSchema);
