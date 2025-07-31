const mongoose = require('mongoose');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const productService = require('./productService');
const Payment = require('../models/paymentModel');
const crypto = require('crypto');
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

  // Nếu muốn chỉ cho phép chuyển từng bước một, kiểm tra newIndex === currentIndex + 1

  order.status = newStatus;
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

  const order = new Order({
    ...orderData,
    customerAddress,
    items,
    total: orderData.total || items.reduce((sum, item) => sum + item.quantity * item.price, 0),
    finalAmount: orderData.finalAmount || orderData.total || items.reduce((sum, item) => sum + item.quantity * item.price, 0),
    discountCode: orderData.discountCode || null,
    discountInfo: orderData.discountInfo || null
  });
  await updateSellCountForOrder(order.items);
  await order.save();

  // Tạo payment nếu chọn phương thức thanh toán là vnpay
  if (orderData.paymentMethod === 'vnpay') {
    // Tạo mã giao dịch duy nhất cho VNPAY
    const vnp_TxnRef = crypto.randomBytes(8).toString('hex');
    await Payment.create({
      orderId: order._id,
      userId: order.userId,
      amount: order.finalAmount,
      paymentMethod: 'vnpay',
      paymentStatus: 'pending',
      vnp_TxnRef
    });
  }

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
  if (!mongoose.isValidObjectId(userId)) {
    throw new Error('ID người dùng không hợp lệ');
  }
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
};

module.exports = {
  //getAllOrders,
  ///getOrderById,
  updateOrderStatus,
  createOrder,
  getPendingOrders,
  getCompletedOrders,
  getOrdersByUserId
};