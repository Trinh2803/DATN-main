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
      usedCount: 0,
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
    if (!discount || !discount.isActive) {
      return res.status(404).json({ message: 'Mã giảm giá không tồn tại hoặc đã bị vô hiệu hóa' });
    }
    const now = new Date();
    if (now < discount.startDate || now > discount.endDate) {
      return res.status(400).json({ message: 'Mã giảm giá chưa có hiệu lực hoặc đã hết hạn' });
    }
    if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
      return res.status(400).json({ message: 'Mã giảm giá đã hết lượt sử dụng' });
    }
    if (totalAmount < discount.minOrderValue) {
      return res.status(400).json({ 
        message: `Đơn hàng tối thiểu phải từ ${discount.minOrderValue.toLocaleString('vi-VN')}đ để sử dụng mã này` 
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
    res.json({
      success: true,
      discount: {
        _id: discount._id,
        code: discount.code,
        name: discount.name,
        description: discount.description,
        discountType: discount.discountType,
        discountValue: discount.discountValue,
        maxDiscount: discount.maxDiscount,
        discountAmount: Math.round(discountAmount),
        finalAmount: Math.round(totalAmount - discountAmount)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Áp dụng mã giảm giá (tăng usedCount)
exports.applyDiscount = async (req, res) => {
  try {
    const { discountId } = req.body;
    const discount = Discount.getDiscountById(discountId);
    if (!discount) {
      return res.status(404).json({ message: 'Mã giảm giá không tồn tại' });
    }
    Discount.updateDiscount(discountId, {
      usedCount: discount.usedCount + 1
    });
    res.json({ message: 'Áp dụng mã giảm giá thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};