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
      price: Number,
      discountInfo: {
        code: String,
        name: String,
        discountType: String,
        discountValue: Number,
        discountAmount: Number
      }
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
    enum: ['Chờ xác nhận', 'Đang chuẩn bị', 'Đang giao', 'Đã giao', 'Đã hủy', 'Đã hoàn thành', 'Đã thanh toán'],
    default: 'Chờ xác nhận'
  },
  adminNote: String,
  // Thông tin thanh toán VNPay
  paymentMethod: {
    type: String,
    enum: ['cod', 'vnpay'],
    default: 'cod'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  vnpayInfo: {
    transactionId: String,        // vnp_TxnRef
    transactionNo: String,        // vnp_TransactionNo
    amount: Number,               // vnp_Amount
    bankCode: String,             // vnp_BankCode
    payDate: String,              // vnp_PayDate
    responseCode: String,         // vnp_ResponseCode
    orderInfo: String,            // vnp_OrderInfo
    secureHash: String            // vnp_SecureHash
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);