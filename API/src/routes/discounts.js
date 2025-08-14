const express = require('express');
const router = express.Router();
const discountController = require('../controllers/discountController');
const authMiddleware = require('../middlewares/authMiddleware');

// Public routes
router.post('/check', discountController.checkDiscountCode);
router.get('/applicable', discountController.getApplicableForProduct);

// Protected routes (admin only)
router.get('/', authMiddleware.verifyToken, authMiddleware.verifyAdmin, discountController.getAllDiscounts);
router.get('/:id', authMiddleware.verifyToken, authMiddleware.verifyAdmin, discountController.getDiscountById);
router.post('/', authMiddleware.verifyToken, authMiddleware.verifyAdmin, discountController.createDiscount);
router.put('/:id', authMiddleware.verifyToken, authMiddleware.verifyAdmin, discountController.updateDiscount);
router.delete('/:id', authMiddleware.verifyToken, authMiddleware.verifyAdmin, discountController.deleteDiscount);
router.post('/apply', authMiddleware.verifyToken, discountController.applyDiscount);

module.exports = router;