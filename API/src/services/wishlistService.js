const mongoose = require('mongoose');
const Wishlist = require('../models/wishlistModel');
const Product = require('../models/productModel');

const addToWishlist = async (userId, productId) => {
  try {
    // Kiểm tra sản phẩm có tồn tại không
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Sản phẩm không tồn tại');
    }

    // Kiểm tra xem đã có trong wishlist chưa
    const existingWishlist = await Wishlist.findOne({ userId, productId });
    if (existingWishlist) {
      throw new Error('Sản phẩm đã có trong danh sách yêu thích');
    }

    const wishlistItem = new Wishlist({
      userId,
      productId
    });

    await wishlistItem.save();
    return wishlistItem;
  } catch (error) {
    if (error.code === 11000) {
      throw new Error('Sản phẩm đã có trong danh sách yêu thích');
    }
    throw error;
  }
};

const removeFromWishlist = async (userId, productId) => {
  try {
    const result = await Wishlist.findOneAndDelete({ userId, productId });
    if (!result) {
      throw new Error('Sản phẩm không có trong danh sách yêu thích');
    }
    return result;
  } catch (error) {
    throw error;
  }
};

const getUserWishlist = async (userId) => {
  try {
    const wishlistItems = await Wishlist.find({ userId })
      .populate({
        path: 'productId',
        select: 'name price thumbnail discountPercent discountPrice categoryId',
        model: Product
      })
      .sort({ addedAt: -1 });

    return wishlistItems;
  } catch (error) {
    throw error;
  }
};

const checkWishlistStatus = async (userId, productId) => {
  try {
    const wishlistItem = await Wishlist.findOne({ userId, productId });
    return !!wishlistItem;
  } catch (error) {
    throw error;
  }
};

const clearWishlist = async (userId) => {
  try {
    const result = await Wishlist.deleteMany({ userId });
    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  addToWishlist,
  removeFromWishlist,
  getUserWishlist,
  checkWishlistStatus,
  clearWishlist
}; 