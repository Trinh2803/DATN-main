const orderService = require('../services/orderService');
const productService = require('../services/productService');

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
    const updated = await orderService.updateOrderStatus(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Cập nhật trạng thái thành công', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createOrder = async (req, res) => {
  try {
    const orderData = {
      ...req.body,
    };
    
    // Chỉ thêm userId nếu user đã đăng nhập
    if (req.user && req.user.id) {
      orderData.userId = req.user.id;
    }
    
    // Validate dữ liệu cần thiết
    if (!orderData.customerName || !orderData.customerEmail || !orderData.customerPhone || !orderData.customerAddress) {
      return res.status(400).json({ 
        success: false, 
        message: 'Thông tin khách hàng không đầy đủ. Vui lòng cung cấp tên, email, số điện thoại và địa chỉ.' 
      });
    }
    
    if (!orderData.items || orderData.items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Đơn hàng phải có ít nhất một sản phẩm.' 
      });
    }
    
    const order = await orderService.createOrder(orderData);
    res.status(201).json({ success: true, message: 'Tạo đơn hàng thành công', data: order });
  } catch (err) {
    console.error('Error creating order:', err);
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