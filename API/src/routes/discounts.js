const express = require('express');
const router = express.Router();
const discountController = require('../controllers/discountController');

// Lấy tất cả mã giảm giá
router.get('/', discountController.getAllDiscounts);
// Lấy mã giảm giá theo id
router.get('/:id', discountController.getDiscountById);
// Lấy mã giảm giá theo code
router.get('/code/:code', discountController.getDiscountByCode);
// Tạo mới mã giảm giá
router.post('/', discountController.createDiscount);
// Cập nhật mã giảm giá
router.put('/:id', discountController.updateDiscount);
// Xóa mã giảm giá
router.delete('/:id', discountController.deleteDiscount);

module.exports = router; 