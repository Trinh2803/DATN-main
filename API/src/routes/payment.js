const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Tạo URL thanh toán
router.post('/create_payment_url', paymentController.createPayment);

// Nhận phản hồi từ VNPay
router.get('/vnpay_return', paymentController.paymentReturn);

module.exports = router;
