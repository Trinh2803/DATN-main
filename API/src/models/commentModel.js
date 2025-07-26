const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
  productId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: false // Có thể có bình luận ẩn danh
  },
  userName: { 
    type: String, 
    required: true 
  },
  userEmail: { 
    type: String, 
    required: true 
  },
  rating: { 
    type: Number, 
    min: 1, 
    max: 5, 
    required: true 
  },
  content: { 
    type: String, 
    required: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminReply: {
    content: String,
    adminId: { type: Schema.Types.ObjectId, ref: 'User' },
    repliedAt: { type: Date, default: Date.now }
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  editedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { 
  timestamps: true 
});

// Index để tối ưu query
commentSchema.index({ productId: 1, status: 1 });
commentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema); 