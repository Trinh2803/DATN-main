const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');
const {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getNewProducts,
  getSaleProducts,
  getProductById,
  getHotProducts
} = require('../controllers/productController');

// Tạo instance multer với thư mục 'products'
const productUpload = upload('products');

router.get('/new', getNewProducts);
router.get('/sale', getSaleProducts);
router.get('/hot', getHotProducts);
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Áp dụng verifyToken và verifyAdmin cho các tuyến đường cần quyền admin
router.post('/add', verifyToken, verifyAdmin, productUpload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'images', maxCount: 5 }]), createProduct);
router.put('/:id', verifyToken, verifyAdmin, productUpload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'images', maxCount: 5 }]), updateProduct);
router.delete('/:id', verifyToken, verifyAdmin, deleteProduct);

module.exports = router;