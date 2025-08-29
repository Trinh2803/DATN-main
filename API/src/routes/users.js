const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');
const { 
  getAllUsers, 
  login, 
  register, 
  updateUser, 
  getUserById, 
  changeUserRole, 
  requestPasswordReset, 
  verifyOtp, 
  verifyResetPasswordOtp,
  resetPassword, 
  verifyRegistration,
  sendOtp,
  addToWishlist,
  removeFromWishlist,
  getWishlist
} = require('../controllers/userController');
const upload = require('../middlewares/uploadMiddleware');

// Admin routes (require admin token)
router.get('/', verifyToken, verifyAdmin, getAllUsers);
router.patch('/:id/role', verifyToken, verifyAdmin, changeUserRole);

// Authentication routes (public)
router.post('/register', register);
router.post('/login', login);

// Password reset flow
router.post('/forgot-password', requestPasswordReset); // Step 1: Request OTP
router.post('/verify-reset-otp', verifyResetPasswordOtp); // Step 2: Verify OTP
router.post('/reset-password', resetPassword); // Step 3: Set new password

// Email verification flow
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/verify-registration', verifyRegistration);

// User profile routes (require user token)
router.put('/profile', verifyToken, upload('uploads').single('avatar'), updateUser);
router.get('/:id', verifyToken, getUserById);

// Wishlist routes (require user token)
router.post('/wishlist', verifyToken, addToWishlist);
router.delete('/wishlist/:productId', verifyToken, removeFromWishlist);
router.get('/wishlist/mine', verifyToken, getWishlist);

module.exports = router;