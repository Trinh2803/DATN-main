const mongoose = require('mongoose');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Discount = require('../models/discountModel');
const productService = require('./productService');

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

const updateOrderStatus = async (id, status, adminNote) => {
  console.log(`Updating order ${id} to status: ${status}`);
  
  if (!mongoose.isValidObjectId(id)) {
    throw new Error('ID đơn hàng không hợp lệ');
  }
  
  const order = await Order.findById(id);
  if (!order) {
    throw new Error('Không tìm thấy đơn hàng');
  }
  
  console.log(`Current order status: ${order.status}`);
  
  const validStatuses = ['Chờ xác nhận', 'Đang chuẩn bị', 'Đang giao', 'Đã giao', 'Đã hủy', 'Đã hoàn thành'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Trạng thái không hợp lệ: ${status}. Các trạng thái hợp lệ: ${validStatuses.join(', ')}`);
  }
  
  // Chỉ áp dụng các ràng buộc nghiêm ngặt cho một số trường hợp cụ thể
  
  // Ngăn chặn việc chuyển từ trạng thái "Đã hủy" sang trạng thái khác (trừ admin có thể sửa lỗi)
  if (order.status === 'Đã hủy' && status !== 'Đã hủy' && status !== 'Chờ xác nhận') {
    console.warn(`Attempting to change cancelled order ${id} from ${order.status} to ${status}`);
    // Cho phép admin khôi phục đơn hàng đã hủy về trạng thái chờ xác nhận
  }
  
  // Ngăn chặn việc chuyển sang "Đã hủy" từ các trạng thái đã hoàn thành
  if (status === 'Đã hủy' && (order.status === 'Đã giao' || order.status === 'Đã hoàn thành')) {
    throw new Error('Đơn hàng đã giao hoặc hoàn thành không thể hủy');
  }
  
  // Cập nhật trạng thái
  order.status = status;
  if (adminNote !== undefined) {
    order.adminNote = adminNote;
  }
  
  // Thêm timestamp cho việc cập nhật
  order.updatedAt = new Date();
  
  await order.save();
  console.log(`Order ${id} updated successfully to status: ${status}`);
  
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
  // Suy ra discountInfo từ các item nếu thiếu ở cấp đơn hàng
  if (!orderData.discountInfo && Array.isArray(orderData.items)) {
    const fromItem = orderData.items.find((it) => it && it.discountInfo && it.discountInfo._id);
    if (fromItem) {
      orderData.discountInfo = {
        _id: String(fromItem.discountInfo._id),
        code: fromItem.discountInfo.code,
      };
      console.log('[ORDER] Inferred order-level discountInfo from items:', orderData.discountInfo);
    }
  }

  // Kiểm tra mã giảm giá trước khi tạo đơn hàng
  if (orderData.discountInfo?._id) {
    const discountIdStr = String(orderData.discountInfo._id);
    console.log('[ORDER] Incoming discountInfo:', orderData.discountInfo);
    const discount = await Discount.getDiscountById(discountIdStr);
    
    if (discount) {
      const now = new Date();
      // Kiểm tra thời hạn sử dụng
      const isWithinTime = (!discount.startDate || now >= new Date(discount.startDate)) && 
                          (!discount.endDate || now <= new Date(discount.endDate));
      
      // Kiểm tra giới hạn sử dụng tổng
      const isUnderGlobalLimit = !discount.usageLimit || (discount.usedCount || 0) < discount.usageLimit;
      
      // Kiểm tra giới hạn sử dụng mỗi người dùng
      let isUnderUserLimit = true;
      const userId = orderData.userId;
      
      if (userId && discount.usageLimitPerUser) {
        const usedByUser = (discount.usedBy && discount.usedBy[userId]) || 0;
        isUnderUserLimit = usedByUser < discount.usageLimitPerUser;
      }
      
      // Nếu mã không còn hiệu lực hoặc đã hết lượt sử dụng
      if (!discount.isActive || !isWithinTime || !isUnderGlobalLimit || !isUnderUserLimit) {
        throw new Error('Mã giảm giá không còn khả dụng hoặc đã hết lượt sử dụng');
      }
    } else {
      throw new Error('Mã giảm giá không hợp lệ');
    }
  }
  
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
        // Mang theo thông tin biến thể nếu có (hỗ trợ nhiều tên trường từ FE)
        // Lưu ý: FE có thể gửi selectedVariant._id (ObjectId) không trùng với variants.id (string). Sẽ ưu tiên resolve bằng size.
        variantId: item.variantId || item.variant?.id || item.selectedVariant?.id || item.selectedVariant?._id || undefined,
        size: item.size || item.variant?.size || item.selectedVariant?.size || item.variantSize || undefined,
        quantity: item.quantity,
        price: item.price
      };
    })
  );

  // Tính toán tổng tiền trước khi áp dụng giảm giá
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  
  // Tạo order data với userId (nếu có)
  const orderDataToSave = {
    ...orderData,
    customerAddress,
    items,
    subtotal,
    total: subtotal,
    discountAmount: 0
  };
  
  // Áp dụng mã giảm giá nếu có
  if (orderData.discountInfo?._id) {
    const discount = await Discount.getDiscountById(orderData.discountInfo._id);
    if (discount) {
      let discountAmount = 0;
      
      if (discount.discountType === 'percentage') {
        // Giảm giá theo phần trăm
        discountAmount = (subtotal * discount.discountValue) / 100;
        // Áp dụng giới hạn giảm giá tối đa nếu có
        if (discount.maxDiscount && discountAmount > discount.maxDiscount) {
          discountAmount = discount.maxDiscount;
        }
      } else {
        // Giảm giá cố định
        discountAmount = Math.min(discount.discountValue, subtotal);
      }
      
      orderDataToSave.discountAmount = discountAmount;
      orderDataToSave.total = Math.max(0, subtotal - discountAmount);
    }
  }

  // Chỉ thêm userId nếu có
  if (orderData.userId) {
    orderDataToSave.userId = orderData.userId;
  }

  const order = new Order(orderDataToSave);
  // 1) Validate tồn kho cho tất cả items (hỗ trợ biến thể)
  for (const item of order.items) {
    const product = await Product.findById(item.productId).lean();
    if (!product) {
      throw new Error(`Không tìm thấy sản phẩm với ID ${item.productId}`);
    }
    if (product.variants && product.variants.length > 0) {
      // Bắt buộc phải có biến thể: chấp nhận variantId hoặc size
      let variantId = item.variantId;
      let variant = null;
      if (variantId) {
        variant = product.variants.find(v => String(v.id) === String(variantId));
      } else if (item.size) {
        variant = product.variants.find(v => String(v.size).toLowerCase() === String(item.size).toLowerCase());
        if (variant) variantId = variant.id;
      }
      if (!variantId || !variant) {
        throw new Error('Sản phẩm có biến thể, vui lòng chọn biến thể cụ thể để đặt hàng');
      }
      if (!variant) {
        throw new Error('Biến thể không hợp lệ hoặc không tồn tại');
      }
      const vStock = typeof variant.stock === 'number' ? variant.stock : 0;
      if (vStock < item.quantity) {
        throw new Error(`Biến thể "${variant.size || variant.id}" của sản phẩm "${product.name}" không đủ hàng. Còn: ${vStock}, yêu cầu: ${item.quantity}`);
      }
    } else {
      const currentStock = typeof product.stock === 'number' ? product.stock : 0;
      if (currentStock < item.quantity) {
        throw new Error(`Sản phẩm "${product.name}" không đủ hàng. Còn: ${currentStock}, yêu cầu: ${item.quantity}`);
      }
    }
  }

  // 2) Giảm tồn kho trước khi lưu đơn hàng, có rollback nếu lưu đơn thất bại (hỗ trợ biến thể)
  const decremented = [];
  try {
    // Giảm tồn kho với $inc và điều kiện stock >= quantity
    for (const item of order.items) {
      let incRes;
      // Xác định variantId hiệu lực nếu có
      let effVariantId = item.variantId;
      if (!effVariantId && item.size) {
        const prod = await Product.findById(item.productId).lean();
        const found = prod?.variants?.find(v => String(v.size).toLowerCase() === String(item.size).toLowerCase());
        if (found) effVariantId = found.id;
      }
      if (effVariantId) {
        // Giảm tồn kho biến thể
        incRes = await Product.updateOne(
          { _id: item.productId, 'variants.id': effVariantId, 'variants.stock': { $gte: item.quantity } },
          { $inc: { 'variants.$.stock': -item.quantity } }
        );
        if (!incRes || incRes.modifiedCount !== 1) {
          throw new Error('Cập nhật tồn kho biến thể thất bại do không đủ hàng hoặc lỗi hệ thống');
        }
        decremented.push({ productId: item.productId, variantId: effVariantId, quantity: item.quantity });
      } else {
        // Sản phẩm không có biến thể
        incRes = await Product.updateOne(
          { _id: item.productId, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } }
        );
        if (!incRes || incRes.modifiedCount !== 1) {
          throw new Error('Cập nhật tồn kho thất bại do không đủ hàng hoặc lỗi hệ thống');
        }
        decremented.push({ productId: item.productId, quantity: item.quantity });
      }
    }

    // Lưu đơn hàng
    await order.save();

    // Cập nhật sellCount sau khi lưu đơn thành công
    await updateSellCountForOrder(order.items);

    // Log thông tin về mã giảm giá (nếu có)
    if (order.discountInfo?._id) {
      console.log(`[ORDER] Order ${order._id} created with discount: ${order.discountInfo._id}`);
    }

    return order;
  } catch (err) {
    // Rollback tồn kho nếu có lỗi
    if (decremented.length > 0) {
      for (const d of decremented) {
        try {
          if (d.variantId) {
            await Product.updateOne(
              { _id: d.productId, 'variants.id': d.variantId },
              { $inc: { 'variants.$.stock': d.quantity } }
            );
          } else {
            await Product.updateOne({ _id: d.productId }, { $inc: { stock: d.quantity } });
          }
        } catch (rbErr) {
          console.error('[ORDER][ROLLBACK] Lỗi khi hoàn tác tồn kho cho sản phẩm', d.productId, rbErr);
        }
      }
    }
    throw err;
  }
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