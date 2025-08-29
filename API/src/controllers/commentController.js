const Comment = require('../models/commentModel');
const Product = require('../models/productModel');

// Lấy tất cả bình luận (dành cho admin)
const getAllComments = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      productId: req.query.productId,
      rating: req.query.rating
    };
    
    // Giả sử commentService.getAllComments xử lý lọc dữ liệu
    const comments = await Comment.find(filters).populate('userId', 'name email');
    res.status(200).json({ 
      success: true, 
      message: 'Lấy danh sách bình luận thành công', 
      data: comments 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Lấy bình luận theo ID (dành cho admin)
const getCommentById = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id).populate('userId', 'name email');
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bình luận' });
    }
    res.status(200).json({ 
      success: true, 
      message: 'Lấy chi tiết bình luận thành công', 
      data: comment 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Lấy bình luận theo sản phẩm (public)
const getCommentsByProduct = async (req, res) => {
  try {
    const productId = req.params.productId;

    // Kiểm tra xem sản phẩm có tồn tại không
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }

    const comments = await Comment.find({ productId, status: 'approved' }).populate('userId', 'name email');
    res.status(200).json({ 
      success: true, 
      message: 'Lấy bình luận sản phẩm thành công', 
      data: comments 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Tạo bình luận mới (yêu cầu đăng nhập)
const createComment = async (req, res) => {
  try {
    const commentData = {
      ...req.body,
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      status: 'pending' // Bình luận mới sẽ ở trạng thái chờ duyệt
    };

    // Kiểm tra xem sản phẩm có tồn tại không
    const product = await Product.findById(commentData.productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }

    const comment = await Comment.create(commentData);
    res.status(201).json({ 
      success: true, 
      message: 'Tạo bình luận thành công', 
      data: comment 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Cập nhật trạng thái bình luận (dành cho admin)
const updateCommentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const adminId = req.user.id;
    const validStatuses = ['pending', 'approved', 'rejected'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }

    const comment = await Comment.findByIdAndUpdate(
      req.params.id,
      { status, updatedBy: adminId },
      { new: true }
    );
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bình luận' });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Cập nhật trạng thái bình luận thành công', 
      data: comment 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Trả lời bình luận (dành cho admin)
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

    const comment = await Comment.findByIdAndUpdate(
      req.params.id,
      { $push: { replies: { content, adminId, createdAt: new Date() } } },
      { new: true }
    );
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bình luận' });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Trả lời bình luận thành công', 
      data: comment 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Chỉnh sửa bình luận (dành cho admin)
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

    const updateData = { updatedBy: adminId };
    if (content) updateData.content = content;
    if (rating) updateData.rating = rating;

    const comment = await Comment.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bình luận' });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Chỉnh sửa bình luận thành công', 
      data: comment 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Xóa bình luận (dành cho admin)
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bình luận' });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Xóa bình luận thành công', 
      data: comment 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Lấy thống kê bình luận (dành cho admin)
const getCommentStats = async (req, res) => {
  try {
    const stats = await Comment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          averageRating: { $avg: '$rating' }
        }
      }
    ]);
    res.status(200).json({ 
      success: true, 
      message: 'Lấy thống kê bình luận thành công', 
      data: stats 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Duyệt nhiều bình luận cùng lúc (dành cho admin)
const bulkUpdateStatus = async (req, res) => {
  try {
    const { commentIds, status } = req.body;
    const adminId = req.user.id;
    const validStatuses = ['pending', 'approved', 'rejected'];

    if (!commentIds || !Array.isArray(commentIds) || commentIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Danh sách ID bình luận không hợp lệ' 
      });
    }

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Trạng thái không hợp lệ' 
      });
    }

    const results = [];
    for (const commentId of commentIds) {
      try {
        const comment = await Comment.findByIdAndUpdate(
          commentId,
          { status, updatedBy: adminId },
          { new: true }
        );
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

// Lấy bình luận của người dùng hiện tại cho một sản phẩm cụ thể
const getCommentByUserAndProduct = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    // Kiểm tra xem sản phẩm có tồn tại không
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }

    const comment = await Comment.findOne({ userId, productId, status: 'approved' }).populate('userId', 'name email');

    res.status(200).json({
      success: true,
      data: comment || null,
      message: comment ? 'Tìm thấy bình luận' : 'Không tìm thấy bình luận cho người dùng và sản phẩm này'
    });
  } catch (error) {
    console.error('Lỗi trong getCommentByUserAndProduct:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
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
  bulkUpdateStatus,
  getCommentByUserAndProduct
};