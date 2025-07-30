const productService = require('../services/productService');
const discountModel = require('../models/discountModel');
const productModel = require('../models/productModel');

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
    res.status(200).json(hotProducts); // Trả về mảng thay vì object
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
    const { name, slug, description, price, salePrice, categoryId, discountId } = req.body;
    // Sửa đường dẫn để bao gồm /products/
    const thumbnail = req.files?.thumbnail ? `/images/products/${req.files.thumbnail[0].filename}` : '';
    const images = req.files?.images?.map(file => `/images/products/${file.filename}`) || [];

    const newProduct = await productService.createProduct({
      name, slug, description, price, salePrice, categoryId, thumbnail, images, discountId
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
    const { name, slug, description, price, salePrice, categoryId, discountId } = req.body;

    // Sửa đường dẫn để bao gồm /products/
    const updated = await productService.updateProduct(id, {
      name, slug, description, price, salePrice, categoryId, discountId
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

const checkProductDiscount = async (req, res) => {
  try {
    const { productId, discountCode } = req.body;
    if (!productId || !discountCode) {
      return res.status(400).json({ message: 'Thiếu productId hoặc discountCode' });
    }
    const product = await productService.getProductById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
    const discount = discountModel.getDiscountByCode(discountCode);
    if (!discount) {
      return res.status(404).json({ message: 'Mã giảm giá không tồn tại' });
    }
    // Thêm log để debug
    console.log('DEBUG: product.discountId =', product.discountId);
    console.log('DEBUG: discount.id =', discount.id);
    console.log('DEBUG: typeof product.discountId =', typeof product.discountId);
    console.log('DEBUG: typeof discount.id =', typeof discount.id);
    if (!product.discountId || product.discountId.toString() !== discount.id.toString()) {
      return res.status(400).json({ message: 'Mã giảm giá không áp dụng cho sản phẩm này' });
    }
    // Kiểm tra hiệu lực mã giảm giá
    const now = new Date();
    if (discount.startDate && new Date(discount.startDate) > now) {
      return res.status(400).json({ message: 'Mã giảm giá chưa bắt đầu' });
    }
    if (discount.endDate && new Date(discount.endDate) < now) {
      return res.status(400).json({ message: 'Mã giảm giá đã hết hạn' });
    }
    if (discount.active === false) {
      return res.status(400).json({ message: 'Mã giảm giá đã bị khóa' });
    }
    res.json({
      discountType: discount.discountType,
      discountValue: discount.discountValue,
      message: 'Áp dụng mã giảm giá thành công',
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Lỗi khi kiểm tra mã giảm giá' });
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
  getHotProducts,
  checkProductDiscount
};