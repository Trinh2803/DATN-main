const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: String,
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: String,
  address: String,
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'customer'], default: 'customer' },
  avatar: { type: String, default: null },
  
  // Email verification fields
  isVerified: { type: Boolean, default: false },
  verificationOtp: { type: String, default: null },
  verificationOtpExpires: { type: Date, default: null },
  
  // Password reset fields
  resetPasswordOtp: { type: String, default: null },
  resetPasswordOtpExpires: { type: Date, default: null },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);