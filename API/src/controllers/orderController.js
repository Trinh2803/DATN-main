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

const Discount = require('../models/discountModel');

const createOrder = async (req, res) => {
  try {
    const orderData = {
      ...req.body,
    };

    // Kiểm tra mã giảm giá nếu có
    if (orderData.discountInfo?._id) {
      const discount = await Discount.getDiscountById(orderData.discountInfo._id);
      
      if (!discount) {
        return res.status(400).json({
          success: false,
          message: 'Mã giảm giá không hợp lệ'
        });
      }

      const now = new Date();
      
      // Kiểm tra thời hạn sử dụng
      const isWithinTime = (!discount.startDate || now >= new Date(discount.startDate)) && 
                         (!discount.endDate || now <= new Date(discount.endDate));
      
      // Kiểm tra giới hạn sử dụng tổng
      const isUnderGlobalLimit = !discount.usageLimit || (discount.usedCount || 0) < discount.usageLimit;
      
      // Kiểm tra giới hạn sử dụng mỗi người dùng
      let isUnderUserLimit = true;
      const userId = orderData.userId || (req.user?.id);
      
      if (userId && discount.usageLimitPerUser) {
        const usedByUser = (discount.usedBy && discount.usedBy[userId]) || 0;
        isUnderUserLimit = usedByUser < discount.usageLimitPerUser;
      }
      
      // Nếu mã không còn hiệu lực hoặc đã hết lượt sử dụng
      if (!discount.isActive || !isWithinTime || !isUnderGlobalLimit || !isUnderUserLimit) {
        return res.status(400).json({
          success: false,
          message: 'Mã giảm giá không còn khả dụng hoặc đã hết lượt sử dụng'
        });
      }
      
      // Đã chuyển việc cập nhật số lần sử dụng sang orderService.js
      // để đảm bảo chỉ cập nhật khi đơn hàng được tạo thành công
    }
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