const commentService = require('../services/commentService');

// Lấy tất cả bình luận
const getAllComments = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      productId: req.query.productId,
      rating: req.query.rating
    };
    
    const comments = await commentService.getAllComments(filters);
    res.status(200).json({ 
      success: true, 
      message: 'Lấy danh sách bình luận thành công', 
      data: comments 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Lấy bình luận theo ID
const getCommentById = async (req, res) => {
  try {
    const comment = await commentService.getCommentById(req.params.id);
    res.status(200).json({ 
      success: true, 
      message: 'Lấy chi tiết bình luận thành công', 
      data: comment 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Lấy bình luận theo sản phẩm
const getCommentsByProduct = async (req, res) => {
  try {
    const comments = await commentService.getCommentsByProduct(req.params.productId);
    res.status(200).json({ 
      success: true, 
      message: 'Lấy bình luận sản phẩm thành công', 
      data: comments 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Tạo bình luận mới
const createComment = async (req, res) => {
  try {
    const commentData = {
      ...req.body,
      userId: req.user ? req.user.id : null
    };
    
    const comment = await commentService.createComment(commentData);
    res.status(201).json({ 
      success: true, 
      message: 'Tạo bình luận thành công', 
      data: comment 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Cập nhật trạng thái bình luận
const updateCommentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const adminId = req.user.id;
    
    const comment = await commentService.updateCommentStatus(req.params.id, status, adminId);
    res.status(200).json({ 
      success: true, 
      message: 'Cập nhật trạng thái bình luận thành công', 
      data: comment 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Trả lời bình luận
const replyToComment = async (req, res) => {
  try {
    const { content } = req.body;
    const adminId = req.user.id;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nội dung trả lời không được để trống' 
      });
    }
    
    const comment = await commentService.replyToComment(req.params.id, { content }, adminId);
    res.status(200).json({ 
      success: true, 
      message: 'Trả lời bình luận thành công', 
      data: comment 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Chỉnh sửa bình luận
const editComment = async (req, res) => {
  try {
    const { content, rating } = req.body;
    const adminId = req.user.id;
    
    if (!content && !rating) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phải cung cấp nội dung hoặc đánh giá để chỉnh sửa' 
      });
    }
    
    const updateData = {};
    if (content) updateData.content = content;
    if (rating) updateData.rating = rating;
    
    const comment = await commentService.editComment(req.params.id, updateData, adminId);
    res.status(200).json({ 
      success: true, 
      message: 'Chỉnh sửa bình luận thành công', 
      data: comment 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Xóa bình luận
const deleteComment = async (req, res) => {
  try {
    const comment = await commentService.deleteComment(req.params.id);
    res.status(200).json({ 
      success: true, 
      message: 'Xóa bình luận thành công', 
      data: comment 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Lấy thống kê bình luận
const getCommentStats = async (req, res) => {
  try {
    const stats = await commentService.getCommentStats();
    res.status(200).json({ 
      success: true, 
      message: 'Lấy thống kê bình luận thành công', 
      data: stats 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Duyệt nhiều bình luận cùng lúc
const bulkUpdateStatus = async (req, res) => {
  try {
    const { commentIds, status } = req.body;
    const adminId = req.user.id;
    
    if (!commentIds || !Array.isArray(commentIds) || commentIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Danh sách ID bình luận không hợp lệ' 
      });
    }
    
    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Trạng thái không hợp lệ' 
      });
    }
    
    const results = [];
    for (const commentId of commentIds) {
      try {
        const comment = await commentService.updateCommentStatus(commentId, status, adminId);
        results.push({ id: commentId, success: true, data: comment });
      } catch (err) {
        results.push({ id: commentId, success: false, error: err.message });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;
    
    res.status(200).json({ 
      success: true, 
      message: `Cập nhật ${successCount} bình luận thành công, ${failCount} bình luận thất bại`, 
      data: results 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
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
}; 