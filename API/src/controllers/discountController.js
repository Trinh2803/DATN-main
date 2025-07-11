const discountModel = require('../models/discountModel');

exports.getAllDiscounts = (req, res) => {
  const discounts = discountModel.getAllDiscounts();
  res.json(discounts);
};

exports.getDiscountById = (req, res) => {
  const discount = discountModel.getDiscountById(req.params.id);
  if (!discount) return res.status(404).json({ message: 'Discount not found' });
  res.json(discount);
};

exports.getDiscountByCode = (req, res) => {
  const discount = discountModel.getDiscountByCode(req.params.code);
  if (!discount) return res.status(404).json({ message: 'Discount not found' });
  res.json(discount);
};

exports.createDiscount = (req, res) => {
  const { code, description, discountType, discountValue, startDate, endDate, active } = req.body;
  if (!code || !discountType || !discountValue) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  if (discountModel.getDiscountByCode(code)) {
    return res.status(400).json({ message: 'Discount code already exists' });
  }
  const discount = discountModel.createDiscount({
    code,
    description: description || '',
    discountType,
    discountValue,
    startDate: startDate || null,
    endDate: endDate || null,
    active: active !== undefined ? active : true,
  });
  res.status(201).json(discount);
};

exports.updateDiscount = (req, res) => {
  const updated = discountModel.updateDiscount(req.params.id, req.body);
  if (!updated) return res.status(404).json({ message: 'Discount not found' });
  res.json(updated);
};

exports.deleteDiscount = (req, res) => {
  const deleted = discountModel.deleteDiscount(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Discount not found' });
  res.json({ message: 'Discount deleted' });
}; 