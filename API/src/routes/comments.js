const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');
const {
  getAllComments,
  getCommentById,
  getCommentsByProduct,
  createComment,
  updateCommentStatus,
  replyToComment,
  editComment,
  deleteComment,
  getCommentStats,
  bulkUpdateStatus
} = require('../controllers/commentController');

// Routes cho admin (yêu cầu xác thực)
router.get('/stats', verifyToken, verifyAdmin, getCommentStats);
router.get('/', verifyToken, verifyAdmin, getAllComments);
router.get('/:id', verifyToken, verifyAdmin, getCommentById);
router.put('/:id/status', verifyToken, verifyAdmin, updateCommentStatus);
router.put('/:id/reply', verifyToken, verifyAdmin, replyToComment);
router.put('/:id/edit', verifyToken, verifyAdmin, editComment);
router.delete('/:id', verifyToken, verifyAdmin, deleteComment);
router.post('/bulk-update', verifyToken, verifyAdmin, bulkUpdateStatus);

// Routes cho public (không yêu cầu xác thực)
router.get('/product/:productId', getCommentsByProduct);
router.post('/', createComment); // Có thể tạo bình luận không cần đăng nhập

module.exports = router; 