const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, trim: true, default: '' },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { 
    type: String, 
    enum: ['SuperAdmin', 'Admin', 'Principal', 'HR', 'Teacher', 'Accountant', 'Student', 'Parent'], 
    required: true 
  },
  branches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }], // Accessible branches
  activeBranch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }, // Currently selected branch context
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  twoFactorSecret: String,
  twoFactorEnabled: { type: Boolean, default: false },
  refreshToken: { type: String, select: false },
  isActive: { type: Boolean, default: true },
  lastLogin: Date
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

module.exports = mongoose.model('User', userSchema);

