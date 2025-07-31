const wishlistService = require('../services/wishlistService');

const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    if (!productId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Thiếu thông tin sản phẩm' 
      });
    }

    const result = await wishlistService.addToWishlist(userId, productId);
    res.status(201).json({ 
      success: true, 
      message: 'Đã thêm vào danh sách yêu thích', 
      data: result 
    });
  } catch (err) {
    res.status(400).json({ 
      success: false, 
      message: err.message 
    });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const result = await wishlistService.removeFromWishlist(userId, productId);
    res.status(200).json({ 
      success: true, 
      message: 'Đã xóa khỏi danh sách yêu thích', 
      data: result 
    });
  } catch (err) {
    res.status(400).json({ 
      success: false, 
      message: err.message 
    });
  }
};

const getUserWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const wishlist = await wishlistService.getUserWishlist(userId);
    res.status(200).json({ 
      success: true, 
      message: 'Lấy danh sách yêu thích thành công', 
      data: wishlist 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};

const checkWishlistStatus = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const isInWishlist = await wishlistService.checkWishlistStatus(userId, productId);
    res.status(200).json({ 
      success: true, 
      message: 'Kiểm tra trạng thái thành công', 
      data: { isInWishlist } 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};

const clearWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await wishlistService.clearWishlist(userId);
    res.status(200).json({ 
      success: true, 
      message: 'Đã xóa toàn bộ danh sách yêu thích', 
      data: result 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};

module.exports = {
  addToWishlist,
  removeFromWishlist,
  getUserWishlist,
  checkWishlistStatus,
  clearWishlist
}; 