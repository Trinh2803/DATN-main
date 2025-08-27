// Kiểm tra user đã mua sản phẩm này chưa
const hasBoughtProduct = async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.params.productId;
    const bought = await orderService.hasUserBoughtProduct(userId, productId);
    res.json({ success: true, bought });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
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
    console.log('updateOrderStatus called with:', {
      orderId: req.params.id,
      body: req.body,
      user: req.user
    });
    
    const { status, adminNote } = req.body;
    
    // Validate input
    if (!status) {
      return res.status(400).json({ 
        success: false, 
        message: 'Trạng thái không được để trống' 
      });
    }
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false, 
        message: 'Thông tin người dùng không hợp lệ' 
      });
    }
    
    const updated = await orderService.updateOrderStatus(req.params.id, status, adminNote);
    
    console.log('Order status updated successfully:', {
      orderId: req.params.id,
      newStatus: status,
      adminId: req.user.id
    });
    
    res.status(200).json({ 
      success: true, 
      message: 'Cập nhật trạng thái thành công', 
      data: updated 
    });
  } catch (err) {
    console.error('Error updating order status:', {
      orderId: req.params.id,
      error: err.message,
      stack: err.stack
    });
    
    // Xử lý các loại lỗi khác nhau
    if (err.message.includes('không hợp lệ') || err.message.includes('không tìm thấy')) {
      return res.status(400).json({ success: false, message: err.message });
    }
    
    if (err.message.includes('không thể') || err.message.includes('không được phép')) {
      return res.status(403).json({ success: false, message: err.message });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server khi cập nhật trạng thái đơn hàng: ' + err.message 
    });
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

const getRevenue = async (req, res) => {
  try {
    let { granularity = 'day', start, end } = req.query;
    const allowed = ['day', 'month', 'quarter'];
    if (!allowed.includes(granularity)) granularity = 'day';
    const data = await orderService.getRevenue({ granularity, start, end });
    return res.status(200).json({ success: true, message: 'Thống kê doanh thu thành công', data });
  } catch (err) {
    console.error('[REVENUE] error:', err);
    return res.status(200).json({ success: true, message: 'Thống kê doanh thu (fallback)', data: { granularity: 'day', series: [], total: 0 } });
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  createOrder,
  getPendingOrders,
  getCompletedOrders,
  getUserOrders,
  getRevenue,
  hasBoughtProduct
};