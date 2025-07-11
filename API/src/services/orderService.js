const mongoose = require('mongoose');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const productService = require('./productService');
console.log('productService:', productService); // Debug

const getAllOrders = async () => {
  return await Order.find();
};

const getOrderById = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error('ID đơn hàng không hợp lệ');
  }
  const order = await Order.findById(id);
  if (!order) throw new Error('Không tìm thấy đơn hàng');
  return order;
};

const updateOrderStatus = async (id, { status }) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error('ID đơn hàng không hợp lệ');
  }
  const order = await Order.findById(id);
  if (!order) throw new Error('Không tìm thấy đơn hàng');
  const validStatuses = ['Chờ xác nhận', 'Đang chuẩn bị', 'Đang giao', 'Đã giao', 'Đã hủy', 'Đã hoàn thành'];
  if (!validStatuses.includes(status)) {
    throw new Error('Trạng thái không hợp lệ');
  }
  order.status = status;
  await order.save();
  return order;
};

// Cập nhật `sellCount` cho sản phẩm sau khi đơn hàng được tạo
const updateSellCountForOrder = async (items) => {
  try {
    console.log('Updating sellCount for items:', items); // Debug
    for (let item of items) {
      const { productId, quantity } = item;
      // Cập nhật sellCount cho mỗi sản phẩm
      await productService.updateSellCount(productId, quantity);
    }
  } catch (err) {
    throw new Error('Không thể cập nhật sellCount cho đơn hàng: ' + err.message);
  }
};

const createOrder = async (orderData) => {
  // Xử lý customerAddress
  let customerAddress = orderData.customerAddress || '';
  if (typeof orderData.customerAddress === 'object' && orderData.customerAddress) {
    customerAddress = [
      orderData.customerAddress.address,
      orderData.customerAddress.district,
      orderData.customerAddress.city
    ]
      .filter(part => part)
      .join(', ') || '';
  }

  // Xử lý items để lấy productName từ Product
const items = await Promise.all(
    orderData.items.map(async (item) => {
      let productName = item.productName || 'Chưa cập nhật';
      let thumbnail = item.thumbnail || '';
      try {
        const product = await Product.findById(item.productId);
        if (product) {
          productName = product.name || 'Chưa cập nhật';
          thumbnail = product.thumbnail || '';
        }
      } catch (err) {
        console.error(`Không tìm thấy sản phẩm với ID ${item.productId}`);
      }
      return {
        productId: item.productId,
        productName,
        thumbnail, // Lưu thumbnail vào items
        quantity: item.quantity,
        price: item.price
      };
    })
  );

  const order = new Order({
    ...orderData,
    customerAddress,
    items,
    total: items.reduce((sum, item) => sum + item.quantity * item.price, 0)
  });
  await updateSellCountForOrder(order.items);
  await order.save();
  return order;
};

const getPendingOrders = async () => {
  return await Order.find({ status: 'Chờ xác nhận' });
};

const getCompletedOrders = async () => {
  return await Order.find({ status: 'Đã hoàn thành' });
};
const getOrdersByUserId = async (userId) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw new Error('ID người dùng không hợp lệ');
  }
  return await Order.find({ userId }).populate({
    path: 'items.productId',
    select: 'name thumbnail',
    model: Product,
  });
};

module.exports = {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  createOrder,
  getPendingOrders,
  getCompletedOrders,
getOrdersByUserId
};