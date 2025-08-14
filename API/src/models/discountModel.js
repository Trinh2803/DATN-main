const fs = require('fs');
const path = require('path');

const DISCOUNT_FILE = path.join(__dirname, '../../../Data/Deho.discounts.json');

function readDiscounts() {
  if (!fs.existsSync(DISCOUNT_FILE)) return [];
  const data = fs.readFileSync(DISCOUNT_FILE, 'utf-8');
  return data ? JSON.parse(data) : [];
}

function writeDiscounts(discounts) {
  try {
    // Tạo thư mục nếu chưa tồn tại
    const dir = path.dirname(DISCOUNT_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Ghi dữ liệu vào file tạm trước
    const tempFile = DISCOUNT_FILE + '.tmp';
    fs.writeFileSync(tempFile, JSON.stringify(discounts, null, 2));
    
    // Đổi tên file tạm thành file chính thức
    if (fs.existsSync(DISCOUNT_FILE)) {
      fs.unlinkSync(DISCOUNT_FILE);
    }
    fs.renameSync(tempFile, DISCOUNT_FILE);
    
    console.log('Đã cập nhật file giảm giá thành công');
    return true;
  } catch (error) {
    console.error('Lỗi khi ghi file giảm giá:', error);
    console.error('Đường dẫn file:', DISCOUNT_FILE);
    console.error('Lỗi chi tiết:', error.message);
    return false;
  }
}

function getAllDiscounts() {
  return readDiscounts();
}

function getDiscountById(_id) {
  return readDiscounts().find(d => d._id === _id);
}

function getDiscountByCode(code) {
  return readDiscounts().find(d => d.code === code);
}

function createDiscount(discount) {
  const discounts = readDiscounts();
  discount._id = Date.now().toString();
  discounts.push(discount);
  writeDiscounts(discounts);
  return discount;
}

function updateDiscount(_id, updated) {
  console.log(`[DEBUG] Updating discount ${_id} with:`, JSON.stringify(updated, null, 2));
  const discounts = readDiscounts();
  const idx = discounts.findIndex(d => d._id === _id);
  if (idx === -1) {
    console.log(`[DEBUG] Discount ${_id} not found`);
    return null;
  }
  
  // Tạo bản cập nhật mới
  const currentDiscount = discounts[idx];
  const newDiscount = { ...currentDiscount, ...updated };
  
  // Tự động tăng usedCount nếu có trong updated
  if (typeof updated.usedCount === 'number') {
    newDiscount.usedCount = (currentDiscount.usedCount || 0) + updated.usedCount;
  }
  
  // Tự động cập nhật isActive nếu vượt quá giới hạn
  if (newDiscount.usageLimit && newDiscount.usedCount >= newDiscount.usageLimit) {
    console.log(`[DEBUG] Disabling discount ${_id} - reached usage limit`);
    newDiscount.isActive = false;
  }
  
  // Cập nhật lại mảng
  discounts[idx] = newDiscount;
  
  // Ghi ra file
  const writeSuccess = writeDiscounts(discounts);
  if (!writeSuccess) {
    console.error(`[ERROR] Failed to write discounts file after updating ${_id}`);
    return null;
  }
  
  console.log(`[DEBUG] Successfully updated discount ${_id}`);
  return newDiscount;
}

function deleteDiscount(_id) {
  const discounts = readDiscounts();
  const idx = discounts.findIndex(d => d._id === _id);
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