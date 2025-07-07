const jwt = require('jsonwebtoken');
const userService = require('../services/userService');
const sendOtpEmail = require('../ultils/mailer');
const bcrypt = require('bcrypt');
const otpStore = new Map();
const getAllUsers = async (req, res) => {
  try {
    const { search } = req.query; // Lấy searchQuery từ query params
    const users = await userService.getAllUsers(search);
    res.status(200).json({ success: true, message: 'Lấy danh sách người dùng thành công', data: users });
  } catch (err) {
    console.error('Error in getAllUsers:', err.message);
    res.status(500).json({ success: false, message: err.message || 'Lỗi khi lấy danh sách người dùng' });
  }
};

const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await userService.getUserById(userId);
    res.status(200).json({ success: true, message: 'Lấy thông tin người dùng thành công', data: user });
  } catch (err) {
    console.error('Error in getUserById:', err.message);
    res.status(400).json({ success: false, message: err.message || 'Lỗi khi lấy thông tin người dùng' });
  }
};

const register = async (req, res) => {
  try {
    const newUser = await userService.register(req.body);
    res.status(201).json({ success: true, message: 'Đăng ký thành công', data: newUser });
  } catch (err) {
    console.error('Error in register:', err.message);
    res.status(400).json({ success: false, message: err.message || 'Lỗi khi đăng ký' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email });
    const result = await userService.login(email, password);
    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        token: result.token,
        user: {
          _id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          phone: result.user.phone,
          address: result.user.address,
          role: result.user.role,
          avatar: result.user.avatar || null,
        },
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(400).json({ success: false, message: err.message || 'Lỗi khi đăng nhập' });
  }
};

const updateUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = {
      ...req.body,
      avatar: req.file,
    };
    console.log('updateData:', updateData);
    const updatedUser = await userService.updateUser(userId, updateData, req); // Truyền req
    res.status(200).json({ success: true, message: 'Cập nhật thông tin thành công', data: updatedUser });
  } catch (err) {
    console.error('Update user error:', err.message);
    res.status(400).json({ success: false, message: err.message || 'Lỗi khi cập nhật thông tin' });
  }
};

const changeUserRole = async (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;
    if (!role) {
      console.log('Missing role in request:', req.body);
      throw new Error('Vai trò không được để trống');
    }
    const updatedUser = await userService.changeUserRole(userId, role);
    res.status(200).json({ success: true, message: 'Thay đổi vai trò thành công', data: updatedUser });
  } catch (err) {
    console.error('Error changing user role:', err.message);
    res.status(400).json({ success: false, message: err.message || 'Lỗi khi thay đổi vai trò' });
  }
};
const requestResetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userService.getUserByEmail(email);
    if (!user) throw new Error('Email chưa được đăng ký');

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    otpStore.set(email, { otp, expiresAt: Date.now() + 5 * 60 * 1000 }); // 5 phút

    await sendOtpEmail(email, otp);
    res.status(200).json({ success: true, message: 'Đã gửi mã OTP về email' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Xác minh OTP
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const record = otpStore.get(email);
    if (!record || record.otp !== otp) throw new Error('Mã OTP không hợp lệ');
    if (Date.now() > record.expiresAt) throw new Error('Mã OTP đã hết hạn');

    res.status(200).json({ success: true, message: 'OTP hợp lệ' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Đặt lại mật khẩu
const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const hashed = await bcrypt.hash(newPassword, 10);
    const updated = await userService.resetPassword(email, hashed);
    res.status(200).json({ success: true, message: 'Đặt lại mật khẩu thành công' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
module.exports = {
  getAllUsers,
  register,
  login,
  updateUser,
  getUserById,
  changeUserRole,
  requestResetPassword,
  verifyOtp,
  resetPassword,
};