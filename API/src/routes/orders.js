const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');
const {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  createOrder,
  getPendingOrders,
  getCompletedOrders,
  getUserOrders,
  getRevenue,
  hasBoughtProduct
} = require('../controllers/orderController');
// Kiểm tra user đã mua sản phẩm này chưa (phải đặt trước route động :id)
router.get('/has-bought/:productId', verifyToken, hasBoughtProduct);

// Định nghĩa các route cụ thể trước
router.get('/pending', verifyToken, verifyAdmin, getPendingOrders);
router.get('/completed', verifyToken, verifyAdmin, getCompletedOrders);
router.get('/user', verifyToken, getUserOrders);
router.get('/revenue', verifyToken, verifyAdmin, getRevenue);

// Sau đó định nghĩa các route động
router.get('/', verifyToken, verifyAdmin, getAllOrders);
router.get('/:id', verifyToken, getOrderById);
router.put('/:id', verifyToken, verifyAdmin, updateOrderStatus);
router.post('/', createOrder); // Bỏ verifyToken để cho phép tạo đơn hàng không cần đăng nhập
router.post('/auth', verifyToken, createOrder); // Route cho user đã đăng nhập

module.exports = router;