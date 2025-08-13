const mongoose = require('mongoose');
const Comment = require('../models/commentModel');
const Product = require('../models/productModel');

// Lấy tất cả bình luận
const getAllComments = async (filters = {}) => {
  const query = {};
  
  if (filters.status) {
    query.status = filters.status;
  }
  
  if (filters.productId) {
    // Handle special product identifiers like 'homepage'
    const specialProducts = ['homepage'];
    
    // Only validate as ObjectId if it's not a special product identifier
    if (!specialProducts.includes(filters.productId) && !mongoose.isValidObjectId(filters.productId)) {
      throw new Error('ID sản phẩm không hợp lệ');
    }
    
    query.productId = filters.productId;
  }
  
  if (filters.rating) {
    query.rating = filters.rating;
  }

  return await Comment.find(query)
    .populate('productId', 'name thumbnail')
    .populate('userId', 'name email')
    .populate('adminReply.adminId', 'name')
    .populate('editedBy', 'name')
    .sort({ createdAt: -1 });
};

// Lấy bình luận theo ID
const getCommentById = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error('ID bình luận không hợp lệ');
  }
  
  const comment = await Comment.findById(id)
    .populate('productId', 'name thumbnail')
    .populate('userId', 'name email')
    .populate('adminReply.adminId', 'name')
    .populate('editedBy', 'name');
    
  if (!comment) {
    throw new Error('Không tìm thấy bình luận');
  }
  
  return comment;
};

// Lấy bình luận theo sản phẩm
const getCommentsByProduct = async (productId) => {
  // Handle special product identifiers like 'homepage'
  const specialProducts = ['homepage'];
  
  // If it's not a special product identifier, validate as MongoDB ObjectId
  if (!specialProducts.includes(productId) && !mongoose.isValidObjectId(productId)) {
    throw new Error('ID sản phẩm không hợp lệ');
  }
  
  return await Comment.find({ 
    productId, 
    status: 'approved' 
  })
    .populate('userId', 'name')
    .populate('adminReply.adminId', 'name')
    .sort({ createdAt: -1 });
};

// Tạo bình luận mới
const createComment = async (commentData) => {
  // Handle special product identifiers like 'homepage'
  const specialProducts = ['homepage'];
  
  // Only validate product existence for regular product IDs
  if (!specialProducts.includes(commentData.productId)) {
    const product = await Product.findById(commentData.productId);
    if (!product) {
      throw new Error('Sản phẩm không tồn tại');
    }
  }
  
  const comment = new Comment(commentData);
  await comment.save();
  
  // For special products, don't try to populate productId since it won't exist in Product collection
  if (specialProducts.includes(commentData.productId)) {
    return await comment.populate([
      { path: 'userId', select: 'name email' }
    ]);
  } else {
    return await comment.populate([
      { path: 'productId', select: 'name thumbnail' },
      { path: 'userId', select: 'name email' }
    ]);
  }
};

// Cập nhật trạng thái bình luận
const updateCommentStatus = async (id, status, adminId) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error('ID bình luận không hợp lệ');
  }
  
  const validStatuses = ['pending', 'approved', 'rejected'];
  if (!validStatuses.includes(status)) {
    throw new Error('Trạng thái không hợp lệ');
  }
  
  const comment = await Comment.findById(id);
  if (!comment) {
    throw new Error('Không tìm thấy bình luận');
  }
  
  comment.status = status;
  if (status === 'rejected') {
    comment.editedBy = adminId;
    comment.editedAt = new Date();
  }
  
  await comment.save();
  
  return await comment.populate([
    { path: 'productId', select: 'name thumbnail' },
    { path: 'userId', select: 'name email' },
    { path: 'editedBy', select: 'name' }
  ]);
};

// Trả lời bình luận (admin)
const replyToComment = async (id, replyData, adminId) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error('ID bình luận không hợp lệ');
  }
  
  const comment = await Comment.findById(id);
  if (!comment) {
    throw new Error('Không tìm thấy bình luận');
  }
  
  if (comment.status !== 'approved') {
    throw new Error('Chỉ có thể trả lời bình luận đã được duyệt');
  }
  
  comment.adminReply = {
    content: replyData.content,
    adminId: adminId,
    repliedAt: new Date()
  };
  
  await comment.save();
  
  return await comment.populate([
    { path: 'productId', select: 'name thumbnail' },
    { path: 'userId', select: 'name email' },
    { path: 'adminReply.adminId', select: 'name' }
  ]);
};

// Chỉnh sửa bình luận
const editComment = async (id, updateData, adminId) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error('ID bình luận không hợp lệ');
  }
  
  const comment = await Comment.findById(id);
  if (!comment) {
    throw new Error('Không tìm thấy bình luận');
  }
  
  // Chỉ cho phép cập nhật content và rating
  if (updateData.content) {
    comment.content = updateData.content;
  }
  if (updateData.rating) {
    comment.rating = updateData.rating;
  }
  
  comment.isEdited = true;
  comment.editedAt = new Date();
  comment.editedBy = adminId;
  
  await comment.save();
  
  return await comment.populate([
    { path: 'productId', select: 'name thumbnail' },
    { path: 'userId', select: 'name email' },
    { path: 'editedBy', select: 'name' }
  ]);
};

// Xóa bình luận
const deleteComment = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error('ID bình luận không hợp lệ');
  }
  
  const comment = await Comment.findByIdAndDelete(id);
  if (!comment) {
    throw new Error('Không tìm thấy bình luận');
  }
  
  return comment;
};

// Thống kê bình luận
const getCommentStats = async () => {
  const stats = await Comment.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);
  
  const totalComments = await Comment.countDocuments();
  const pendingComments = await Comment.countDocuments({ status: 'pending' });
  const approvedComments = await Comment.countDocuments({ status: 'approved' });
  const rejectedComments = await Comment.countDocuments({ status: 'rejected' });
  
  return {
    total: totalComments,
    pending: pendingComments,
    approved: approvedComments,
    rejected: rejectedComments,
    stats: stats
  };
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
  getCommentStats
}; 