const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const {
  addToWishlist,
  removeFromWishlist,
  getUserWishlist,
  checkWishlistStatus,
  clearWishlist
} = require('../controllers/wishlistController');

// Tất cả routes đều yêu cầu đăng nhập
router.use(verifyToken);

// Thêm sản phẩm vào wishlist
router.post('/add', addToWishlist);

// Xóa sản phẩm khỏi wishlist
router.delete('/remove/:productId', removeFromWishlist);

// Lấy danh sách wishlist của user
router.get('/user', getUserWishlist);

// Kiểm tra trạng thái sản phẩm trong wishlist
router.get('/check/:productId', checkWishlistStatus);

// Xóa toàn bộ wishlist
router.delete('/clear', clearWishlist);

module.exports = router; 