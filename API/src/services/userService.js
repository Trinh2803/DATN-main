const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const SECRET_KEY = process.env.SECRET_KEY || 'your-secret-key-here-make-it-long-and-secure';
console.log('SECRET_KEY in userService:', SECRET_KEY);

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

    const user = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      role: role || 'customer',
    });

    await user.save();
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

const resetPassword = async (email, hashedPassword) => {
  return await User.findOneAndUpdate(
    { email },
    { password: hashedPassword },
    { new: true }
  );
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
};