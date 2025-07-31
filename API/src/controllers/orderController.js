const orderService = require('../services/orderService');
const productService = require('../services/productService');
const Payment = require('../models/paymentModel');

const getAllOrders = async (req, res) => {
  try {
    const orders = await orderService.getAllOrders();
    res.status(200).json({ success: true, message: 'Lấy danh sách đơn hàng thành công', data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    res.status(200).json({ success: true, message: 'Lấy chi tiết đơn hàng thành công', data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
const getUserOrders = async (req, res) => {
  try {
    console.log('Fetching orders for userId:', req.user.id); // Debug
    const orders = await orderService.getOrdersByUserId(req.user.id);
    res.status(200).json({
      success: true,
      message: 'Lấy danh sách đơn hàng của người dùng thành công',
      data: orders,
    });
  } catch (err) {
    console.error('Error in getUserOrders:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};
const updateOrderStatus = async (req, res) => {
  try {
    const updated = await orderService.updateOrderStatus(req.params.id, req.body.status);
    res.status(200).json({ success: true, message: 'Cập nhật trạng thái thành công', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createOrder = async (req, res) => {
  try {
    const orderData = {
      ...req.body,
      userId: req.user.id, // Sửa từ req.user.userId thành req.user.id
    };
    const order = await orderService.createOrder(orderData);
    let payment = null;
    if (orderData.paymentMethod === 'vnpay') {
      payment = await Payment.findOne({ orderId: order._id, paymentMethod: 'vnpay' });
    }
    res.status(201).json({
      success: true,
      message: 'Tạo đơn hàng thành công',
      data: order,
      payment: payment ? { paymentId: payment._id, vnp_TxnRef: payment.vnp_TxnRef } : null
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Thêm hai controller mới
const getPendingOrders = async (req, res) => {
  try {
    const orders = await orderService.getPendingOrders();
    res.status(200).json({ success: true, message: 'Lấy danh sách đơn hàng chờ xác nhận thành công', data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
const getCompletedOrders = async (req, res) => {
  try {
    const orders = await orderService.getCompletedOrders();
    res.status(200).json({ success: true, message: 'Lấy danh sách đơn hàng đã giao thành công', data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  createOrder,
  getPendingOrders,
  getCompletedOrders,
getUserOrders
};