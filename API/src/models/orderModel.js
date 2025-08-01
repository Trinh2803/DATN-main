const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
  userId: { type: String, required: false }, // Đổi thành không bắt buộc
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
  status: {
    type: String,
    enum: ['Chờ xác nhận', 'Đang chuẩn bị', 'Đang giao', 'Đã giao', 'Đã hủy', 'Đã hoàn thành'],
    default: 'Chờ xác nhận'
  },
  adminNote: String
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);