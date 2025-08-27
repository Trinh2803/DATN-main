const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  phone: String,
  address: String,
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'customer'], default: 'customer' },
  avatar: { type: String, default: null }, // Thêm trường avatar
  // Xác minh email khi đăng ký
  isVerified: { type: Boolean, default: false },
  verificationOtp: { type: String, default: null },
  verificationOtpExpires: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);