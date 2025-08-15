const Discount = require('../models/discountModel');

// Lấy tất cả mã giảm giá
exports.getAllDiscounts = async (req, res) => {
  try {
    const discounts = Discount.getAllDiscounts();
    res.json(discounts);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Lấy các mã giảm giá phù hợp theo sản phẩm/danh mục (public)
exports.getApplicableForProduct = async (req, res) => {
  try {
    const { productId, categoryId } = req.query;
    const now = new Date();
    const all = Discount.getAllDiscounts();

    const applicable = all.filter(d => {
      if (!d.isActive) return false;
      // Chuẩn hóa thời gian để so sánh, endDate tính đến hết ngày (23:59:59.999)
      const start = d.startDate ? new Date(d.startDate) : null;
      const end = d.endDate ? new Date(d.endDate) : null;
      if (end) end.setHours(23, 59, 59, 999);
      if ((start && now < start) || (end && now > end)) return false;
      if (d.usageLimit && d.usedCount >= d.usageLimit) return false;
      // Lọc theo sản phẩm/danh mục nếu có cấu hình
      let okProduct = true;
      if (d.applicableProducts && d.applicableProducts.length > 0) {
        okProduct = !!productId && d.applicableProducts.map(x => x.toString()).includes(productId.toString());
      }
      let okCategory = true;
      if (d.applicableCategories && d.applicableCategories.length > 0) {
        okCategory = !!categoryId && d.applicableCategories.map(x => x.toString()).includes(categoryId.toString());
      }
      return okProduct && okCategory;
    }).map(d => ({
      _id: d._id,
      code: d.code,
      name: d.name,
      description: d.description,
      discountType: d.discountType,
      discountValue: d.discountValue,
      minOrderValue: d.minOrderValue || 0,
      maxDiscount: d.maxDiscount,
      startDate: d.startDate,
      endDate: d.endDate
    }));

    res.json({ success: true, data: applicable });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Lấy mã giảm giá theo ID
exports.getDiscountById = async (req, res) => {
  try {
    const discount = Discount.getDiscountById(req.params.id);
    if (!discount) {
      return res.status(404).json({ message: 'Mã giảm giá không tồn tại' });
    }
    res.json(discount);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Tạo mới mã giảm giá
exports.createDiscount = async (req, res) => {
  try {
    const {
      code,
      name,
      description,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscount,
      startDate,
      endDate,
      usageLimit,
      usageLimitPerUser,
      applicableProducts,
      applicableCategories
    } = req.body;

    if (!code || !name || !discountType || !discountValue || !startDate || !endDate) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin bắt buộc' });
    }

    const existingDiscount = Discount.getDiscountByCode(code.toUpperCase());
    if (existingDiscount) {
      return res.status(400).json({ message: 'Mã giảm giá đã tồn tại' });
    }

    if (discountType === 'percentage' && (discountValue <= 0 || discountValue > 100)) {
      return res.status(400).json({ message: 'Phần trăm giảm giá phải từ 1-100%' });
    }
    if (discountType === 'fixed' && discountValue <= 0) {
      return res.status(400).json({ message: 'Số tiền giảm giá phải lớn hơn 0' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return res.status(400).json({ message: 'Ngày kết thúc phải sau ngày bắt đầu' });
    }

    const discount = {
      code: code.toUpperCase(),
      name,
      description,
      discountType,
      discountValue,
      minOrderValue: minOrderValue || 0,
      maxDiscount,
      startDate: start,
      endDate: end,
      usageLimit,
      usageLimitPerUser,
      usedCount: 0,
      usedBy: {},
      isActive: true,
      applicableProducts,
      applicableCategories,
      createdAt: new Date()
    };
    const savedDiscount = Discount.createDiscount(discount);
    res.status(201).json(savedDiscount);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Cập nhật mã giảm giá
exports.updateDiscount = async (req, res) => {
  try {
    const {
      code,
      name,
      description,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscount,
      startDate,
      endDate,
      usageLimit,
      isActive,
      usageLimitPerUser,
      applicableProducts,
      applicableCategories
    } = req.body;

    const discount = Discount.getDiscountById(req.params.id);
    if (!discount) {
      return res.status(404).json({ message: 'Mã giảm giá không tồn tại' });
    }

    if (code && code !== discount.code) {
      const existingDiscount = Discount.getDiscountByCode(code.toUpperCase());
      if (existingDiscount && existingDiscount._id !== req.params.id) {
        return res.status(400).json({ message: 'Mã giảm giá đã tồn tại' });
      }
    }
    if (discountType === 'percentage' && (discountValue <= 0 || discountValue > 100)) {
      return res.status(400).json({ message: 'Phần trăm giảm giá phải từ 1-100%' });
    }
    if (discountType === 'fixed' && discountValue <= 0) {
      return res.status(400).json({ message: 'Số tiền giảm giá phải lớn hơn 0' });
    }
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start >= end) {
        return res.status(400).json({ message: 'Ngày kết thúc phải sau ngày bắt đầu' });
      }
    }

    const updateData = {
      code: code ? code.toUpperCase() : discount.code,
      name: name || discount.name,
      description: description !== undefined ? description : discount.description,
      discountType: discountType || discount.discountType,
      discountValue: discountValue || discount.discountValue,
      minOrderValue: minOrderValue !== undefined ? minOrderValue : discount.minOrderValue,
      maxDiscount: maxDiscount !== undefined ? maxDiscount : discount.maxDiscount,
      startDate: startDate ? new Date(startDate) : discount.startDate,
      endDate: endDate ? new Date(endDate) : discount.endDate,
      usageLimit: usageLimit !== undefined ? usageLimit : discount.usageLimit,
      usageLimitPerUser: usageLimitPerUser !== undefined ? usageLimitPerUser : discount.usageLimitPerUser,
      isActive: isActive !== undefined ? isActive : discount.isActive,
      applicableProducts: applicableProducts || discount.applicableProducts,
      applicableCategories: applicableCategories || discount.applicableCategories
    };
    const updatedDiscount = Discount.updateDiscount(req.params.id, updateData);
    if (!updatedDiscount) {
      return res.status(404).json({ message: 'Mã giảm giá không tồn tại' });
    }
    res.json(updatedDiscount);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Xóa mã giảm giá
exports.deleteDiscount = async (req, res) => {
  try {
    const success = Discount.deleteDiscount(req.params.id);
    if (!success) {
      return res.status(404).json({ message: 'Mã giảm giá không tồn tại' });
    }
    res.json({ message: 'Xóa mã giảm giá thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Kiểm tra mã giảm giá
exports.checkDiscountCode = async (req, res) => {
  try {
    const { code, totalAmount, productIds } = req.body;
    if (!code) {
      return res.status(400).json({ message: 'Vui lòng nhập mã giảm giá' });
    }
    const discount = Discount.getDiscountByCode(code.toUpperCase());
    if (!discount) {
      return res.status(404).json({ message: 'Mã giảm giá không tồn tại' });
    }
    if (discount.isActive === false) {
      return res.status(400).json({ message: 'Mã giảm giá đã bị vô hiệu hóa' });
    }
    const now = new Date();
    console.log(`[DEBUG] Current server time: ${now.toISOString()}`);
    console.log(`[DEBUG] Discount start: ${discount.startDate}, end: ${discount.endDate}`);
    
    // Chỉ kiểm tra thời gian nếu có cấu hình
    if (discount.startDate) {
      const start = new Date(discount.startDate);
      if (now < start) {
        return res.status(400).json({ message: `Mã giảm giá chỉ có hiệu lực từ ${start.toLocaleString('vi-VN')}` });
      }
    }
    
    if (discount.endDate) {
      const end = new Date(discount.endDate);
      end.setHours(23, 59, 59, 999);
      if (now > end) {
        return res.status(400).json({ message: `Mã giảm giá đã hết hạn vào ${end.toLocaleString('vi-VN')}` });
      }
    }
    if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
      return res.status(400).json({ message: 'Mã giảm giá đã hết lượt sử dụng' });
    }
    const minOrder = discount.minOrderValue || 0;
    if (totalAmount < minOrder) {
      return res.status(400).json({ 
        message: `Đơn hàng tối thiểu phải từ ${minOrder.toLocaleString('vi-VN')}đ để sử dụng mã này` 
      });
    }
    if (discount.applicableProducts && discount.applicableProducts.length > 0) {
      const applicableProductIds = discount.applicableProducts.map(id => id.toString());
      const hasApplicableProduct = productIds.some(productId => 
        applicableProductIds.includes(productId.toString())
      );
      if (!hasApplicableProduct) {
        return res.status(400).json({ message: 'Mã giảm giá không áp dụng cho sản phẩm trong giỏ hàng' });
      }
    }
    let discountAmount = 0;
    if (discount.discountType === 'percentage') {
      discountAmount = (totalAmount * discount.discountValue) / 100;
      if (discount.maxDiscount) {
        discountAmount = Math.min(discountAmount, discount.maxDiscount);
      }
    } else {
      discountAmount = discount.discountValue;
    }
    // Include all necessary fields in the response
    const response = {
      success: true,
      discount: {
        _id: discount._id,
        code: discount.code,
        name: discount.name,
        description: discount.description,
        discountType: discount.discountType,
        discountValue: discount.discountValue,
        minOrderValue: discount.minOrderValue,
        maxDiscount: discount.maxDiscount,
        startDate: discount.startDate,
        endDate: discount.endDate,
        usageLimit: discount.usageLimit,
        usedCount: discount.usedCount,
        isActive: discount.isActive,
        applicableProducts: discount.applicableProducts || [],
        applicableCategories: discount.applicableCategories || [],
        discountAmount: Math.round(discountAmount),
        finalAmount: Math.round(totalAmount - discountAmount)
      }
    };
    
    console.log('Sending discount response:', JSON.stringify(response, null, 2));
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Áp dụng mã giảm giá
// Sử dụng atomic update để đảm bảo tính nhất quán dữ liệu
exports.applyDiscount = async (req, res) => {
  try {
    const { code } = req.body;
    const { userId } = req.user || {}; // Cho phép null nếu không có user

    console.log(`[DISCOUNT] Applying discount code: ${code} for user: ${userId || 'guest'}`);

    // Tìm mã giảm giá
    const discount = await Discount.getDiscountByCode(code);
    if (!discount) {
      console.log(`[DISCOUNT] Discount code not found: ${code}`);
      return res.status(404).json({
        success: false,
        message: 'Mã giảm giá không tồn tại',
        code: 'NOT_FOUND'
      });
    }

    console.log(`[DISCOUNT] Found discount:`, JSON.stringify({
      _id: discount._id,
      code: discount.code,
      isActive: discount.isActive,
      usedCount: discount.usedCount,
      usageLimit: discount.usageLimit,
      usageLimitPerUser: discount.usageLimitPerUser || discount.usageLimit,
      startDate: discount.startDate,
      endDate: discount.endDate,
      usedBy: Object.keys(discount.usedBy || {}).length
    }, null, 2));

    // Kiểm tra ngày hiệu lực
    const now = new Date();
    const startDate = discount.startDate ? new Date(discount.startDate) : null;
    const endDate = discount.endDate ? new Date(discount.endDate) : null;
    
    if ((startDate && now < startDate) || (endDate && now > endDate)) {
      console.log(`[DISCOUNT] Discount code ${code} is not within valid date range`);
      return res.status(400).json({
        success: false,
        message: 'Mã giảm giá không nằm trong thời gian áp dụng',
        code: 'INVALID_DATE_RANGE'
      });
    }
    
    // Kiểm tra trạng thái kích hoạt
    if (discount.isActive === false) {
      console.log(`[DISCOUNT] Discount code ${code} is inactive`);
      return res.status(400).json({
        success: false,
        message: 'Mã giảm giá không còn khả dụng',
        code: 'DISCOUNT_INACTIVE'
      });
    }
    
    // Kiểm tra giới hạn sử dụng toàn cục
    if (typeof discount.usageLimit === 'number' && discount.usageLimit > 0) {
      if (discount.usedCount >= discount.usageLimit) {
        console.log(`[DISCOUNT] Global usage limit reached for ${code}: ${discount.usedCount}/${discount.usageLimit}`);
        // Tự động vô hiệu hóa mã nếu đã hết lượt
        if (discount.isActive) {
          console.log(`[DISCOUNT] Auto-disabling used-up discount: ${discount._id}`);
          await Discount.updateDiscount(discount._id, { isActive: false });
        }
        return res.status(400).json({
          success: false,
          message: 'Mã giảm giá đã hết lượt sử dụng',
          code: 'USAGE_LIMIT_REACHED'
        });
      }
    }
    
    // Kiểm tra giới hạn sử dụng cho từng người dùng
    if (userId) {
      const userLimit = discount.usageLimitPerUser || discount.usageLimit;
      const userUsage = (discount.usedBy && discount.usedBy[userId]) || 0;
      
      if (userLimit > 0 && userUsage >= userLimit) {
        console.log(`[DISCOUNT] User ${userId} has reached their usage limit for ${code}: ${userUsage}/${userLimit}`);
        return res.status(400).json({
          success: false,
          message: 'Bạn đã sử dụng hết số lần sử dụng cho mã giảm giá này',
          code: 'USER_LIMIT_REACHED'
        });
      }
    }
    
    // Nếu tất cả các kiểm tra đều pass, tăng số lần sử dụng
    const result = await Discount.atomicUpdateDiscountUsage(discount._id, userId);
    
    if (!result.success) {
      console.log(`[DISCOUNT] Failed to apply discount: ${result.error}`, result);
      return res.status(400).json({
        success: false,
        message: result.error || 'Không thể áp dụng mã giảm giá',
        code: result.code || 'APPLICATION_ERROR'
      });
    }
    
    // Nếu đến đây, mã giảm giá đã được áp dụng thành công
    const updatedDiscount = result.discount;
    console.log(`[DISCOUNT] Successfully applied discount. New usedCount: ${updatedDiscount.usedCount}, User usage: ${userId ? (updatedDiscount.usedBy?.[userId] || 0) : 'N/A'}`);
    
    res.json({ 
      success: true,
      message: 'Áp dụng mã giảm giá thành công',
      discount: {
        _id: updatedDiscount._id,
        code: updatedDiscount.code,
        discountType: updatedDiscount.discountType,
        discountValue: updatedDiscount.discountValue,
        maxDiscount: updatedDiscount.maxDiscount,
        minOrderValue: updatedDiscount.minOrderValue,
        usedCount: updatedDiscount.usedCount,
        usageLimit: updatedDiscount.usageLimit,
        isActive: updatedDiscount.isActive
      }
    });
  } catch (error) {
    console.error('[ERROR] Error in applyDiscount:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server',
      error: error.message 
    });
  }
};