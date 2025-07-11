const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
  userId: { type: String, required: true },
  customerName: String,
  customerEmail: String,
  customerPhone: String,
  customerAddress: String, // Đổi thành String
  customerNote: String,
  items: [
    {
      thumbnail: String,
      productId: { type: String },
      productName: String, // Chỉ giữ một lần
      quantity: Number,
      price: Number
    }
  ],
  total: Number,
  finalAmount: Number,
  discountCode: String,
  discountInfo: {
    code: String,
    name: String,
    discountType: String,
    discountValue: Number,
    discountAmount: Number
  },
  status: {
    type: String,
    enum: ['Chờ xác nhận', 'Đang chuẩn bị', 'Đang giao', 'Đã giao', 'Đã hủy', 'Đã hoàn thành'],
    default: 'Chờ xác nhận'
  },
  adminNote: String
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);