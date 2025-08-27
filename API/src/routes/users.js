const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');
const { getAllUsers, login, register, updateUser, getUserById, changeUserRole, requestResetPassword, verifyOtp,  resetPassword, verifyRegistration } = require('../controllers/userController');
const upload = require('../middlewares/uploadMiddleware'); // Thêm middleware upload
// Lấy danh sách người dùng (admin only)
router.get('/', verifyToken, verifyAdmin, getAllUsers);

// Đăng ký và đăng nhập (công khai)
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', requestResetPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);
router.post('/verify-registration', verifyRegistration);
// Cập nhật hồ sơ người dùng (yêu cầu token)
router.put('/profile', verifyToken, upload('uploads').single('avatar'), updateUser); // Sử dụng multer
// Lấy thông tin người dùng theo ID (yêu cầu token)
router.get('/:id', verifyToken, getUserById);

// Thay đổi vai trò người dùng (admin only)
router.patch('/:id/role', verifyToken, verifyAdmin, changeUserRole);

module.exports = router;