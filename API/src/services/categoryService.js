const mongoose = require('mongoose');
const Category = require('../models/categoryModel');
const Product = require('../models/productModel');

// Lấy danh sách danh mục
const getAllCategories = async (name) => {
  try {
    let query = {};
    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }
    const categories = await Category.find(query);
    console.log('Categories fetched:', categories);
    return categories;
  } catch (err) {
    console.error('Error fetching categories:', err.message);
    throw new Error('Lỗi khi lấy danh mục: ' + err.message);
  }
};

// Thêm mới danh mục
const createCategory = async ({ name, slug, image }) => {
  try {
    // Kiểm tra trùng name hoặc slug (case-insensitive)
    const existingCategory = await Category.findOne({
      $or: [
        { name: { $regex: `^${name}$`, $options: 'i' } },
        { slug: { $regex: `^${slug}$`, $options: 'i' } },
      ],
    });
    if (existingCategory) {
      if (existingCategory.name.toLowerCase() === name.toLowerCase()) {
        console.log('Duplicate name detected:', name);
        throw new Error('Tên danh mục đã tồn tại');
      }
      if (existingCategory.slug.toLowerCase() === slug.toLowerCase()) {
        console.log('Duplicate slug detected:', slug);
        throw new Error('Slug danh mục đã tồn tại');
      }
    }

    const newCategory = new Category({ name, slug, image });
    const savedCategory = await newCategory.save();
    console.log('Category created:', savedCategory);
    return savedCategory;
  } catch (err) {
    console.error('Error creating category:', err.message);
    throw new Error(err.message || 'Lỗi khi tạo danh mục');
  }
};

// Cập nhật danh mục
const updateCategory = async (id, { name, slug }, file) => {
  try {
    // Kiểm tra id hợp lệ
    if (!mongoose.isValidObjectId(id)) {
      console.log('Invalid category ID:', id);
      throw new Error('ID danh mục không hợp lệ');
    }

    // Kiểm tra trùng name hoặc slug, loại trừ danh mục đang cập nhật
    const existingCategory = await Category.findOne({
      $or: [
        { name: { $regex: `^${name}$`, $options: 'i' } },
        { slug: { $regex: `^${slug}$`, $options: 'i' } },
      ],
      _id: { $ne: id },
    });
    if (existingCategory) {
      if (existingCategory.name.toLowerCase() === name.toLowerCase()) {
        console.log('Duplicate name detected during update:', name);
        throw new Error('Tên danh mục đã tồn tại');
      }
      if (existingCategory.slug.toLowerCase() === slug.toLowerCase()) {
        console.log('Duplicate slug detected during update:', slug);
        throw new Error('Slug danh mục đã tồn tại');
      }
    }

    const updateData = { name, slug };
    if (file) {
      updateData.image = `/images/categories/${file.filename}`;
    }
    const updatedCategory = await Category.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedCategory) {
      console.log('Category not found for update:', id);
      throw new Error('Danh mục không tồn tại');
    }
    console.log('Category updated:', updatedCategory);
    return updatedCategory;
  } catch (err) {
    console.error('Error updating category:', err.message);
    throw new Error(err.message || 'Lỗi khi cập nhật danh mục');
  }
};

// Xóa danh mục
const deleteCategory = async (id) => {
  try {
    // Kiểm tra id hợp lệ
    if (!mongoose.isValidObjectId(id)) {
      console.log('Invalid category ID:', id);
      throw new Error('ID danh mục không hợp lệ');
    }

    // Kiểm tra xem danh mục có sản phẩm liên kết không
    const productCount = await Product.countDocuments({ categoryId: new mongoose.Types.ObjectId(id) });
    console.log('Product count for category', id, ':', productCount);
    if (productCount > 0) {
      console.log('Cannot delete category due to linked products:', id);
      throw new Error('Không thể xóa danh mục vì có sản phẩm liên kết');
    }

    const deletedCategory = await Category.findByIdAndDelete(id);
    if (!deletedCategory) {
      console.log('Category not found for deletion:', id);
      throw new Error('Danh mục không tồn tại');
    }
    console.log('Category deleted:', deletedCategory);
    return deletedCategory;
  } catch (err) {
    console.error('Error deleting category:', err.message);
    throw new Error(err.message || 'Lỗi khi xóa danh mục');
  }
};

module.exports = {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};