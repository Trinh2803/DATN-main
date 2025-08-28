const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken } = require('../middlewares/authMiddleware'); // Sử dụng destructuring để lấy verifyToken

// Tạo đánh giá mới
router.post('/', verifyToken, function(req, res) {
    reviewController.createReview(req, res);
});

// Lấy đánh giá của sản phẩm
router.get('/product/:productId', function(req, res) {
    reviewController.getProductReviews(req, res);
});

// Kiểm tra có thể đánh giá không
router.get('/can-review/:productId/:orderId', verifyToken, function(req, res) {
    reviewController.canReviewProduct(req, res);
});

module.exports = router;