const express = require('express');
const router = express.Router();
const PaymentController = require("../controllers/payController");

// === TẠO YÊU CẦU THANH TOÁN ===
router.post("/create", PaymentController.createPayment);

// === LẤY TRẠNG THÁI GIAO DỊCH ===
router.get("/transaction-status", PaymentController.getTransactionStatus);

// === TRẢ VỀ CALLBACK URL CHO VNPAY ===
router.get("/vnpay/callback", PaymentController.checkIpnVNPay);

module.exports = router;