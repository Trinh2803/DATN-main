const productService = require('../services/productService');

// Lấy danh sách sản phẩm
const getAllProducts = async (req, res) => {
  try {
    const { categoryId, sortBy, order, name } = req.query;
    const products = await productService.getAllProducts({ categoryId, sortBy, order, name });
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Lỗi khi lấy sản phẩm' });
  }
};

// Lấy sản phẩm mới
const getNewProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const newProducts = await productService.getNewProducts(limit);
    res.status(200).json(newProducts);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Lỗi khi lấy sản phẩm mới' });
  }
};
const getHotProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8; // Đổi mặc định từ 10 thành 8
    const hotProducts = await productService.getHotProducts(limit);
    res.status(200).json({ success: true, data: hotProducts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Lỗi khi lấy sản phẩm hot' });
  }
};
// Lấy sản phẩm giảm giá
const getSaleProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    const saleProducts = await productService.getSaleProducts(limit);
    res.status(200).json(saleProducts);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Lỗi khi lấy sản phẩm sale' });
  }
};

// Thêm mới sản phẩm
const createProduct = async (req, res) => {
  try {
    const { name, slug, description, price, salePrice, categoryId, variants } = req.body;
    // Sửa đường dẫn để bao gồm /products/
    const thumbnail = req.files?.thumbnail ? `/images/products/${req.files.thumbnail[0].filename}` : '';
    const images = req.files?.images?.map(file => `/images/products/${file.filename}`) || [];

    // Parse variants nếu có
    let parsedVariants = [];
    if (variants) {
      try {
        parsedVariants = JSON.parse(variants);
      } catch (parseError) {
        console.error('Lỗi parse variants:', parseError);
        parsedVariants = [];
      }
    }

    const newProduct = await productService.createProduct({
      name, slug, description, price, salePrice, categoryId, thumbnail, images, variants: parsedVariants
    });

    res.status(201).json({ success: true, message: 'Tạo sản phẩm thành công', data: newProduct });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Cập nhật sản phẩm
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, price, salePrice, categoryId, variants } = req.body;

    // Parse variants nếu có
    let parsedVariants = [];
    if (variants) {
      try {
        parsedVariants = JSON.parse(variants);
      } catch (parseError) {
        console.error('Lỗi parse variants:', parseError);
        parsedVariants = [];
      }
    }

    // Sửa đường dẫn để bao gồm /products/
    const updated = await productService.updateProduct(id, {
      name, slug, description, price, salePrice, categoryId, variants: parsedVariants
    }, req.files);

    res.status(200).json({ success: true, message: 'Cập nhật sản phẩm thành công', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Xóa sản phẩm
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await productService.deleteProduct(id);
    res.status(200).json({ success: true, message: 'Xóa sản phẩm thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Lấy sản phẩm theo ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }
    res.status(200).json(product);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Lỗi khi lấy sản phẩm' });
  }
};

module.exports = {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getNewProducts,
  getSaleProducts,
  getProductById,
  getHotProducts
};