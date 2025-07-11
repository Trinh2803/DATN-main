const fs = require('fs');
const path = require('path');

const DISCOUNT_FILE = path.join(__dirname, '../../../Data/Deho.discounts.json');

function readDiscounts() {
  if (!fs.existsSync(DISCOUNT_FILE)) return [];
  const data = fs.readFileSync(DISCOUNT_FILE, 'utf-8');
  return data ? JSON.parse(data) : [];
}

function writeDiscounts(discounts) {
  fs.writeFileSync(DISCOUNT_FILE, JSON.stringify(discounts, null, 2));
}

function getAllDiscounts() {
  return readDiscounts();
}

function getDiscountById(id) {
  return readDiscounts().find(d => d.id === id);
}

function getDiscountByCode(code) {
  return readDiscounts().find(d => d.code === code);
}

function createDiscount(discount) {
  const discounts = readDiscounts();
  discount.id = Date.now().toString();
  discounts.push(discount);
  writeDiscounts(discounts);
  return discount;
}

function updateDiscount(id, updated) {
  const discounts = readDiscounts();
  const idx = discounts.findIndex(d => d.id === id);
  if (idx === -1) return null;
  discounts[idx] = { ...discounts[idx], ...updated };
  writeDiscounts(discounts);
  return discounts[idx];
}

function deleteDiscount(id) {
  const discounts = readDiscounts();
  const idx = discounts.findIndex(d => d.id === id);
  if (idx === -1) return false;
  discounts.splice(idx, 1);
  writeDiscounts(discounts);
  return true;
}

module.exports = {
  getAllDiscounts,
  getDiscountById,
  getDiscountByCode,
  createDiscount,
  updateDiscount,
  deleteDiscount,
}; 