const express = require('express');
const router = express.Router();
const discountController = require('../controllers/discountController');
const authMiddleware = require('../middlewares/authMiddleware');

// Public routes
router.post('/check', discountController.checkDiscountCode);

// Protected routes (admin only)
router.get('/', authMiddleware.verifyToken, authMiddleware.isAdmin, discountController.getAllDiscounts);
router.get('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, discountController.getDiscountById);
router.post('/', authMiddleware.verifyToken, authMiddleware.isAdmin, discountController.createDiscount);
router.put('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, discountController.updateDiscount);
router.delete('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, discountController.deleteDiscount);
router.post('/apply', authMiddleware.verifyToken, discountController.applyDiscount);

module.exports = router; 