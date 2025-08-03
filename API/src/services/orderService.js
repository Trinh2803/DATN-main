const mongoose = require('mongoose');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const productService = require('./productService');
console.log('productService:', productService); // Debug

const ORDER_STATUS = [
  'Chờ xác nhận',
  'Đang chuẩn bị',
  'Đang giao',
  'Đã giao',
  'Đã hoàn thành',
  'Đã hủy'
];

async function updateOrderStatus(orderId, newStatus) {
  const order = await Order.findById(orderId);
  if (!order) throw new Error('Không tìm thấy đơn hàng');

  const currentIndex = ORDER_STATUS.indexOf(order.status);
  const newIndex = ORDER_STATUS.indexOf(newStatus);

  // Không cho phép chuyển về trạng thái trước đó
  if (newIndex < currentIndex) {
    throw new Error('Không thể chuyển về trạng thái trước đó');
  }
<<<<<<< HEAD

  // Nếu muốn chỉ cho phép chuyển từng bước một, kiểm tra newIndex === currentIndex + 1

  order.status = newStatus;
=======
  const order = await Order.findById(id);
  if (!order) throw new Error('Không tìm thấy đơn hàng');
  
  const validStatuses = ['Chờ xác nhận', 'Đang chuẩn bị', 'Đang giao', 'Đã giao', 'Đã hủy', 'Đã hoàn thành'];
  if (!validStatuses.includes(status)) {
    throw new Error('Trạng thái không hợp lệ');
  }
  
  // Ngăn chặn việc quay lại trạng thái "Chờ xác nhận"
  if (status === 'Chờ xác nhận' && order.status !== 'Chờ xác nhận') {
    throw new Error('Không thể quay lại trạng thái "Chờ xác nhận" sau khi đã xác nhận đơn hàng');
  }
  
  // Ngăn chặn việc chuyển từ trạng thái "Đã hủy" sang trạng thái khác
  if (order.status === 'Đã hủy' && status !== 'Đã hủy') {
    throw new Error('Đơn hàng đã hủy không thể chuyển sang trạng thái khác');
  }
  
  // Ngăn chặn việc chuyển sang "Đã hủy" từ các trạng thái đã hoàn thành
  if (status === 'Đã hủy' && (order.status === 'Đã giao' || order.status === 'Đã hoàn thành')) {
    throw new Error('Đơn hàng đã giao hoặc hoàn thành không thể hủy');
  }
  
  // Ngăn chặn việc thay đổi trạng thái đã hoàn thành
  if (order.status === 'Đã hoàn thành' && status !== 'Đã hoàn thành') {
    throw new Error('Đơn hàng đã hoàn thành không thể thay đổi trạng thái');
  }
  
  order.status = status;
>>>>>>> 1cffa053ea773e328a32b56188c9855d7a18249e
  await order.save();
  return order;
}

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
        price: item.price,
        discountInfo: item.discountInfo || null // Lưu discountInfo nếu có
      };
    })
  );

  // Tạo order data với userId (nếu có)
  const orderDataToSave = {
    ...orderData,
    customerAddress,
    items,
<<<<<<< HEAD
    total: orderData.total || items.reduce((sum, item) => sum + item.quantity * item.price, 0),
    finalAmount: orderData.finalAmount || orderData.total || items.reduce((sum, item) => sum + item.quantity * item.price, 0),
    discountCode: orderData.discountCode || null,
    discountInfo: orderData.discountInfo || null
  });
=======
    total: items.reduce((sum, item) => sum + item.quantity * item.price, 0)
  };

  // Chỉ thêm userId nếu có
  if (orderData.userId) {
    orderDataToSave.userId = orderData.userId;
  }

  const order = new Order(orderDataToSave);
>>>>>>> 1cffa053ea773e328a32b56188c9855d7a18249e
  await updateSellCountForOrder(order.items);
  await order.save();

  // Tăng usedCount cho các mã giảm giá đã dùng
  const Discount = require('../models/discountModel');
  const usedDiscountCodes = new Set();
  for (const item of order.items) {
    if (item.discountInfo && item.discountInfo.code && !usedDiscountCodes.has(item.discountInfo.code)) {
      const discount = Discount.getDiscountByCode(item.discountInfo.code);
      if (discount) {
        Discount.updateDiscount(discount._id, { usedCount: (discount.usedCount || 0) + 1 });
        usedDiscountCodes.add(item.discountInfo.code);
      }
    }
  }

  return order;
};

const getPendingOrders = async () => {
  return await Order.find({ status: 'Chờ xác nhận' });
};

const getCompletedOrders = async () => {
  return await Order.find({ status: 'Đã hoàn thành' });
};
const getOrdersByUserId = async (userId) => {
  if (!userId) {
    throw new Error('ID người dùng không được cung cấp');
  }
  
  if (!mongoose.isValidObjectId(userId)) {
    throw new Error('ID người dùng không hợp lệ');
  }
<<<<<<< HEAD
  try {
    const orders = await Order.find({ userId });
    
    // Populate products for each order individually to handle invalid ObjectIds
    const populatedOrders = await Promise.all(
      orders.map(async (order) => {
        const populatedItems = await Promise.all(
          order.items.map(async (item) => {
            try {
              if (mongoose.isValidObjectId(item.productId)) {
                const product = await Product.findById(item.productId).select('name thumbnail');
                return {
                  ...item.toObject(),
                  productId: product || item.productId
                };
              } else {
                // If productId is not a valid ObjectId, return item as is
                return item.toObject();
              }
            } catch (error) {
              console.error(`Error populating product ${item.productId}:`, error);
              return item.toObject();
            }
          })
        );
        
        return {
          ...order.toObject(),
          items: populatedItems
        };
      })
    );
    
    return populatedOrders;
  } catch (error) {
    console.error('Error in getOrdersByUserId:', error);
    return await Order.find({ userId });
  }
};

const getAllOrders = async () => {
  try {
    const orders = await Order.find();
    
    // Populate products for each order individually to handle invalid ObjectIds
    const populatedOrders = await Promise.all(
      orders.map(async (order) => {
        const populatedItems = await Promise.all(
          order.items.map(async (item) => {
            try {
              if (mongoose.isValidObjectId(item.productId)) {
                const product = await Product.findById(item.productId).select('name thumbnail');
                return {
                  ...item.toObject(),
                  productId: product || item.productId
                };
              } else {
                // If productId is not a valid ObjectId, return item as is
                return item.toObject();
              }
            } catch (error) {
              console.error(`Error populating product ${item.productId}:`, error);
              return item.toObject();
            }
          })
        );
        
        return {
          ...order.toObject(),
          items: populatedItems
        };
      })
    );
    
    return populatedOrders;
  } catch (error) {
    console.error('Error in getAllOrders:', error);
    return await Order.find();
  }
};

const getOrderById = async (orderId) => {
  if (!mongoose.isValidObjectId(orderId)) {
    throw new Error('ID đơn hàng không hợp lệ');
  }
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Không tìm thấy đơn hàng');
    }
    
    // Populate products for each item individually
    const populatedItems = await Promise.all(
      order.items.map(async (item) => {
        try {
          if (mongoose.isValidObjectId(item.productId)) {
            const product = await Product.findById(item.productId).select('name thumbnail');
            return {
              ...item.toObject(),
              productId: product || item.productId
            };
          } else {
            return item.toObject();
          }
        } catch (error) {
          console.error(`Error populating product ${item.productId}:`, error);
          return item.toObject();
        }
      })
    );
    
    return {
      ...order.toObject(),
      items: populatedItems
    };
  } catch (error) {
    console.error('Error in getOrderById:', error);
    throw error;
  }
=======
  
  return await Order.find({ userId }).populate({
    path: 'items.productId',
    select: 'name thumbnail',
    model: Product,
  });
>>>>>>> 1cffa053ea773e328a32b56188c9855d7a18249e
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