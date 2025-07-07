const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');
const categoryController = require('../controllers/categoryController');

console.log('categoryController:', categoryController);

// GET: Lấy danh sách danh mục
router.get('/', (req, res, next) => {
  console.log('GET /categories called');
  console.log('req:', !!req, 'res:', !!res, 'next:', !!next);
  if (!res) {
    console.error('res is undefined in router!');
    return next(new Error('Response object is undefined'));
  }
  categoryController.getAllCategories(req, res, next);
});

// POST: Thêm danh mục
router.post('/add', verifyToken, verifyAdmin, upload('categories').single('image'), categoryController.createCategory);

// PUT: Cập nhật danh mục
router.put('/update/:id', verifyToken, verifyAdmin, upload('categories').single('image'), categoryController.updateCategory);

// DELETE: Xóa danh mục
router.delete('/delete/:id', verifyToken, verifyAdmin, categoryController.deleteCategory);

module.exports = router;