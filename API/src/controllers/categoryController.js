const categoryService = require('../services/categoryService');

// Lấy danh sách danh mục
const getAllCategories = async (req, res, next) => {
  console.log('getAllCategories called with query:', req.query);
  try {
    const { name } = req.query;
    const categories = await categoryService.getAllCategories(name);
    res.status(200).json({ success: true, data: categories });
  } catch (err) {
    console.error('Error in getAllCategories:', err.message);
    res.status(500).json({ success: false, message: err.message || 'Lỗi khi lấy danh mục' });
  }
};

// Thêm mới danh mục
const createCategory = async (req, res, next) => {
  try {
    const { name, slug } = req.body;
    if (!name || !slug) {
      console.log('Missing name or slug:', { name, slug });
      throw new Error('Tên và slug không được để trống');
    }
    const image = req.file ? `/images/categories/${req.file.filename}` : '';

    const newCate = await categoryService.createCategory({ name, slug, image });
    res.status(201).json({ success: true, message: 'Thêm thành công', data: newCate });
  } catch (err) {
    console.error('Error creating category:', err.message);
    res.status(400).json({ success: false, message: err.message || 'Lỗi khi thêm danh mục' });
  }
};

// Cập nhật danh mục
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, slug } = req.body;
    if (!id || id === 'undefined') {
      console.log('Invalid category ID:', id);
      throw new Error('ID danh mục không hợp lệ');
    }
    if (!name || !slug) {
      console.log('Missing name or slug during update:', { name, slug });
      throw new Error('Tên và slug không được để trống');
    }

    const updated = await categoryService.updateCategory(id, { name, slug }, req.file);
    res.status(200).json({ success: true, message: 'Cập nhật thành công', data: updated });
  } catch (err) {
    console.error('Error updating category:', err.message);
    res.status(400).json({ success: false, message: err.message || 'Lỗi khi cập nhật danh mục' });
  }
};

// Xóa danh mục
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined') {
      console.log('Invalid category ID:', id);
      throw new Error('ID danh mục không hợp lệ');
    }
    await categoryService.deleteCategory(id);
    res.status(200).json({ success: true, message: 'Đã xóa' });
  } catch (err) {
    console.error('Error deleting category:', err.message);
    res.status(400).json({ success: false, message: err.message || 'Lỗi khi xóa danh mục' });
  }
};

module.exports = {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};