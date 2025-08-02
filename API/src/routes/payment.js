const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware');

// Tạo URL thanh toán
router.post('/create_payment_url', paymentController.createPayment);

// Nhận phản hồi từ VNPay
router.get('/vnpay_return', paymentController.paymentReturn);

// Tạo đơn hàng sau khi thanh toán VNPay thành công
router.post('/create_order_after_payment', paymentController.createOrderAfterPayment);

// Lấy thông tin hóa đơn
router.get('/invoice/:orderId', paymentController.getInvoice);

module.exports = router;
