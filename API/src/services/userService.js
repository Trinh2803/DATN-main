const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const { sendRegistrationOtpEmail, sendOtpEmail } = require('../ultils/mailer');
const SECRET_KEY = process.env.SECRET_KEY || 'your-secret-key-here-make-it-long-and-secure';
console.log('SECRET_KEY in userService:', SECRET_KEY);

// Generate a random 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const getAllUsers = async (searchQuery) => {
  try {
    let query = {};
    if (searchQuery) {
      query = {
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { email: { $regex: searchQuery, $options: 'i' } },
        ],
      };
    }
    const users = await User.find(query).select('-password');
    console.log('Users fetched:', users);
    return users;
  } catch (err) {
    console.error('Error fetching users:', err.message);
    throw new Error('Không thể lấy danh sách người dùng');
  }
};

const getUserById = async (userId) => {
  try {
    const user = await User.findById(userId).select('-password');
    if (!user) throw new Error('Không tìm thấy người dùng');
    console.log('User fetched:', user);
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role,
      avatar: user.avatar || null,
    };
  } catch (err) {
    console.error('Error fetching user by ID:', err.message);
    throw new Error(err.message || 'Không tìm thấy người dùng');
  }
};

const register = async (userData) => {
  const { email, password, name, phone, role } = userData;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Duplicate email:', email);
      throw new Error('Email đã tồn tại');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo OTP xác minh đăng ký
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const user = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      role: role || 'customer',
      isVerified: false,
      verificationOtp: otp,
      verificationOtpExpires: new Date(Date.now() + 5 * 60 * 1000)
    });

    await user.save();

    // Gửi email OTP xác minh
    try {
      await sendRegistrationOtpEmail(email, otp);
    } catch (mailErr) {
      console.error('Error sending registration OTP:', mailErr.message);
    }
    console.log('User registered:', user);

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  } catch (err) {
    console.error('Error registering user:', err.message);
    throw new Error(err.message || 'Lỗi khi đăng ký');
  }
};

const login = async (email, password) => {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      throw new Error('Tài khoản không tồn tại');
    }

    // Skip email verification check for admin users
    if (!user.isVerified && user.role !== 'admin') {
      throw new Error('Tài khoản chưa xác minh email');
    }

    let isMatch = false;
    if (user.password.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = password === user.password;
    }
    if (!isMatch) {
      console.log('Incorrect password for:', email);
      throw new Error('Sai mật khẩu');
    }

    console.log('Creating token with:', { userId: user._id, role: user.role, SECRET_KEY });
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      SECRET_KEY,
      { expiresIn: '1d' }
    );
    console.log('Token created:', token);

    console.log('User logged in:', user.email);
    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || null,
      },
    };
  } catch (err) {
    console.error('Error logging in:', err.message);
    throw new Error(err.message || 'Lỗi khi đăng nhập');
  }
};

const verifyRegistration = async (email, otp) => {
  try {
    const user = await User.findOne({ email });
    if (!user) throw new Error('Không tìm thấy người dùng');
    if (user.isVerified) return { message: 'Tài khoản đã được xác minh' };
    if (!user.verificationOtp || !user.verificationOtpExpires) throw new Error('Không có OTP xác minh');
    if (user.verificationOtp !== otp) throw new Error('Mã OTP không hợp lệ');
    if (Date.now() > new Date(user.verificationOtpExpires).getTime()) throw new Error('Mã OTP đã hết hạn');

    user.isVerified = true;
    user.verificationOtp = null;
    user.verificationOtpExpires = null;
    await user.save();
    return { message: 'Xác minh email thành công' };
  } catch (err) {
    console.error('Error verifying registration:', err.message);
    throw new Error(err.message || 'Xác minh thất bại');
  }
};

const updateUser = async (userId, updateData, req) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found:', userId);
      throw new Error('Không tìm thấy người dùng');
    }

    // Xử lý avatar từ multer
    if (req.file) {
      user.avatar = `/images/uploads/${req.file.filename}`;
    }

    // Cập nhật các trường khác
    if (updateData.name) user.name = updateData.name;
    if (updateData.email) user.email = updateData.email;
    if (updateData.phone) user.phone = updateData.phone;
    if (updateData.address) user.address = updateData.address;

    await user.save();
    console.log('User updated:', user);

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role,
      avatar: user.avatar || null,
    };
  } catch (err) {
    console.error('Error updating user:', err.message);
    throw new Error(err.message || 'Lỗi khi cập nhật người dùng');
  }
};

const changeUserRole = async (userId, newRole) => {
  try {
    if (!['admin', 'customer'].includes(newRole)) {
      console.log('Invalid role:', newRole);
      throw new Error('Vai trò không hợp lệ. Chỉ chấp nhận admin hoặc customer.');
    }

    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found:', userId);
      throw new Error('Không tìm thấy người dùng');
    }

    user.role = newRole;
    await user.save();
    console.log('User role updated:', { userId, newRole });

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role,
      avatar: user.avatar || null,
    };
  } catch (err) {
    console.error('Error changing user role:', err.message);
    throw new Error(err.message || 'Lỗi khi thay đổi vai trò người dùng');
  }
};

const getUserByEmail = async (email) => {
  return await User.findOne({ email });
};

// Request password reset by sending OTP
const requestPasswordReset = async (email) => {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Email không tồn tại');
    }
    
    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpires = otpExpires;
    await user.save();
    
    // Send OTP email
    await sendOtpEmail(email, otp, 'reset-password');
    
    return { success: true, message: 'Mã OTP đã được gửi đến email của bạn' };
  } catch (error) {
    console.error('Error in requestPasswordReset:', error);
    throw new Error('Không thể gửi mã OTP. Vui lòng thử lại sau');
  }
};

// Verify OTP for password reset
const verifyResetPasswordOtp = async (email, otp) => {
  try {
    const user = await User.findOne({ 
      email,
      resetPasswordOtp: otp,
      resetPasswordOtpExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      throw new Error('Mã OTP không hợp lệ hoặc đã hết hạn');
    }
    
    // Clear the OTP after successful verification
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpires = undefined;
    await user.save();
    
    return { success: true, message: 'Xác minh OTP thành công' };
  } catch (error) {
    console.error('Error in verifyResetPasswordOtp:', error);
    throw new Error('Xác minh OTP thất bại');
  }
};

// Reset password after OTP verification
const resetPassword = async (email, newPassword) => {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Người dùng không tồn tại');
    }
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password and clear any reset tokens
    user.password = hashedPassword;
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpires = undefined;
    
    await user.save();
    return { success: true, message: 'Đặt lại mật khẩu thành công' };
  } catch (error) {
    console.error('Error in resetPassword:', error);
    throw new Error('Không thể đặt lại mật khẩu');
  }
};

// Send OTP to user's email
const sendOtp = async (email) => {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Email không tồn tại');
    }
    
    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    
    user.verificationOtp = otp;
    user.verificationOtpExpires = otpExpires;
    await user.save();
    
    // Send OTP via email
    await sendOtpEmail(email, otp);
    
    return { success: true, message: 'Đã gửi mã OTP đến email của bạn' };
  } catch (err) {
    console.error('Error sending OTP:', err.message);
    throw new Error('Không thể gửi mã OTP. Vui lòng thử lại sau');
  }
};

// Verify OTP for email verification
const verifyOtp = async (email, otp) => {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Email không tồn tại');
    }
    
    if (user.verificationOtp !== otp) {
      throw new Error('Mã OTP không chính xác');
    }
    
    if (new Date() > user.verificationOtpExpires) {
      throw new Error('Mã OTP đã hết hạn');
    }
    
    // Mark user as verified and clear OTP
    user.isVerified = true;
    user.verificationOtp = undefined;
    user.verificationOtpExpires = undefined;
    await user.save();
    
    return { success: true, message: 'Xác minh email thành công' };
  } catch (err) {
    console.error('Error verifying OTP:', err.message);
    throw new Error(err.message || 'Xác minh thất bại. Vui lòng thử lại');
  }
};

module.exports = {
  register,
  login,
  getAllUsers,
  updateUser,
  getUserById,
  changeUserRole,
  getUserByEmail,
  resetPassword,
  verifyRegistration,
  sendOtp,
  verifyOtp,
};