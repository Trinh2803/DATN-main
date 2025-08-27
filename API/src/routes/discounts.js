const express = require('express');
const router = express.Router();
const discountController = require('../controllers/discountController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

// Public routes
router.post('/check', discountController.checkDiscountCode);
router.get('/applicable', discountController.getApplicableForProduct);

// Protected routes (admin only)
router.get('/', verifyToken, verifyAdmin, discountController.getAllDiscounts);
router.get('/:id', verifyToken, verifyAdmin, discountController.getDiscountById);
router.post('/', verifyToken, verifyAdmin, discountController.createDiscount);
router.put('/:id', verifyToken, verifyAdmin, discountController.updateDiscount);
router.delete('/:id', verifyToken, verifyAdmin, discountController.deleteDiscount);
router.post('/apply', verifyToken, discountController.applyDiscount);

module.exports = router;