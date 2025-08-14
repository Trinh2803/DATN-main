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
    console.log(`[DISCOUNT] Attempting to write to: ${DISCOUNT_FILE}`);
    
    // Tạo thư mục nếu chưa tồn tại
    const dir = path.dirname(DISCOUNT_FILE);
    console.log(`[DISCOUNT] Ensuring directory exists: ${dir}`);
    
    if (!fs.existsSync(dir)) {
      console.log(`[DISCOUNT] Creating directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Ghi dữ liệu vào file tạm trước
    const tempFile = DISCOUNT_FILE + '.tmp';
    console.log(`[DISCOUNT] Writing to temp file: ${tempFile}`);
    
    const dataToWrite = JSON.stringify(discounts, null, 2);
    fs.writeFileSync(tempFile, dataToWrite);
    
    console.log(`[DISCOUNT] Successfully wrote ${dataToWrite.length} bytes to temp file`);
    
    // Đổi tên file tạm thành file chính thức
    if (fs.existsSync(DISCOUNT_FILE)) {
      console.log(`[DISCOUNT] Removing old file: ${DISCOUNT_FILE}`);
      fs.unlinkSync(DISCOUNT_FILE);
    }
    
    console.log(`[DISCOUNT] Renaming ${tempFile} to ${DISCOUNT_FILE}`);
    fs.renameSync(tempFile, DISCOUNT_FILE);
    
    console.log('[DISCOUNT] Successfully updated discount file');
    console.log(`[DISCOUNT] File content sample: ${dataToWrite.substring(0, 200)}...`);
    
    // Verify the file was written correctly
    try {
      const verifyContent = fs.readFileSync(DISCOUNT_FILE, 'utf8');
      console.log(`[DISCOUNT] Verify read ${verifyContent.length} bytes`);
      console.log(`[DISCOUNT] First 100 chars: ${verifyContent.substring(0, 100)}`);
    } catch (verifyError) {
      console.error('[DISCOUNT] Failed to verify file after write:', verifyError);
      return false;
    }
    
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
  
  try {
    let discounts = readDiscounts();
    const idx = discounts.findIndex(d => d._id === _id);
    if (idx === -1) {
      console.log(`[DEBUG] Discount ${_id} not found`);
      return null;
    }
    
    // Tạo bản cập nhật mới
    const currentDiscount = discounts[idx];
    const newDiscount = { ...currentDiscount };
    let hasChanges = false;
    
    // Cập nhật các trường thông thường
    Object.keys(updated).forEach(key => {
      if (key !== 'usedCount' && key !== 'usedBy' && key !== 'isActive') {
        if (JSON.stringify(newDiscount[key]) !== JSON.stringify(updated[key])) {
          newDiscount[key] = updated[key];
          hasChanges = true;
        }
      }
    });
    
    // Xử lý tăng usedCount nếu có
    if (typeof updated.usedCount === 'number') {
      // Đảm bảo usedCount không bao giờ vượt quá usageLimit
      const newCount = (currentDiscount.usedCount || 0) + updated.usedCount;
      
      if (currentDiscount.usageLimit && newCount >= currentDiscount.usageLimit) {
        console.log(`[DEBUG] Reached usage limit for discount ${_id}, capping usedCount at ${currentDiscount.usageLimit}`);
        if (newDiscount.usedCount !== currentDiscount.usageLimit) {
          newDiscount.usedCount = currentDiscount.usageLimit;
          hasChanges = true;
        }
        if (newDiscount.isActive !== false) {
          newDiscount.isActive = false; // Tự động vô hiệu hóa khi đạt giới hạn
          hasChanges = true;
        }
      } else if (newCount !== (currentDiscount.usedCount || 0)) {
        newDiscount.usedCount = newCount;
        hasChanges = true;
      }
      console.log(`[DEBUG] Updated usedCount to ${newDiscount.usedCount}`);
    }
    
    // Xử lý usedBy nếu có
    if (updated.usedBy && typeof updated.usedBy === 'object') {
      newDiscount.usedBy = { ...(currentDiscount.usedBy || {}) };
      let usedByChanged = false;
      
      for (const [userId, inc] of Object.entries(updated.usedBy)) {
        const delta = typeof inc === 'number' ? inc : 0;
        const current = (newDiscount.usedBy[userId] || 0);
        if (delta !== 0) {
          newDiscount.usedBy[userId] = current + delta;
          usedByChanged = true;
        }
      }
      
      if (usedByChanged) {
        hasChanges = true;
      }
    }
    
    // Cập nhật isActive nếu được chỉ định rõ
    if ('isActive' in updated && newDiscount.isActive !== updated.isActive) {
      newDiscount.isActive = updated.isActive;
      hasChanges = true;
    }
    
    // Chỉ cập nhật nếu có thay đổi
    if (hasChanges) {
      // Cập nhật mảng discounts
      discounts = [...discounts];
      discounts[idx] = newDiscount;
      
      // Kiểm tra và vô hiệu hóa nếu đạt giới hạn sử dụng
      if (newDiscount.usageLimit && newDiscount.usedCount >= newDiscount.usageLimit) {
        console.log(`[DEBUG] Disabling discount ${_id} - reached usage limit`);
        newDiscount.isActive = false;
      }
      
      // Ghi vào file
      if (writeDiscounts(discounts)) {
        console.log(`[DEBUG] Successfully updated discount ${_id}`);
        return newDiscount;
      } else {
        console.error(`[ERROR] Failed to write discount ${_id} to file`);
        return null;
      }
    } else {
      console.log(`[DEBUG] No changes to save for discount ${_id}`);
      return newDiscount;
    }
  } catch (error) {
    console.error(`[ERROR] Error updating discount ${_id}:`, error);
    return null;
  }
}

function deleteDiscount(_id) {
  const discounts = readDiscounts();
  const idx = discounts.findIndex(d => d._id === _id);
  if (idx === -1) return false;
  discounts.splice(idx, 1);
  writeDiscounts(discounts);
  return true;
}

// Hàm đơn giản để tăng số lần sử dụng mã giảm giá
function incrementDiscountUsage(_id, userId) {
  console.log(`[DISCOUNT] ===== STARTING DISCOUNT INCREMENT =====`);
  console.log(`[DISCOUNT] Discount ID: ${_id}, User ID: ${userId || 'guest'}`);
  
  try {
    // Đọc toàn bộ danh sách mã giảm giá
    console.log(`[DISCOUNT] Reading discounts from file...`);
    const discounts = readDiscounts();
    
    console.log(`[DISCOUNT] Found ${discounts.length} discounts`);
    const discountIndex = discounts.findIndex(d => d._id === _id);
    
    if (discountIndex === -1) {
      console.error(`[ERROR] Discount ${_id} not found in database`);
      return false;
    }
    
    // Sử dụng spread operator để tạo bản sao nông, nhưng đảm bảo các trường con cũng được sao chép
    const discount = { ...discounts[discountIndex] };
    
    // Sao chép thủ công các trường đặc biệt nếu cần
    if (discounts[discountIndex].usedBy) {
      discount.usedBy = { ...discounts[discountIndex].usedBy };
    }
    
    console.log(`[DISCOUNT] Current discount state:`, {
      code: discount.code,
      usedCount: discount.usedCount,
      usageLimit: discount.usageLimit,
      isActive: discount.isActive,
      usedBy: discount.usedBy ? Object.keys(discount.usedBy).length : 0
    });
    
    // Kiểm tra lại điều kiện sử dụng
    const now = new Date();
    const startDate = discount.startDate ? new Date(discount.startDate) : null;
    const endDate = discount.endDate ? new Date(discount.endDate) : null;
    
    const isValidDate = (!startDate || now >= startDate) && 
                       (!endDate || now <= endDate);
    
    if (!isValidDate) {
      console.log(`[DISCOUNT] Discount ${_id} is not within valid date range`);
      console.log(`[DISCOUNT] Now: ${now}, Start: ${startDate}, End: ${endDate}`);
      return false;
    }
    
    // Kiểm tra giới hạn sử dụng toàn cục
    if (discount.usageLimit !== undefined && discount.usageLimit !== null) {
      const currentUsed = discount.usedCount || 0;
      if (currentUsed >= discount.usageLimit) {
        console.log(`[DISCOUNT] Cannot increment - discount ${_id} has reached usage limit (${currentUsed}/${discount.usageLimit})`);
        return false;
      }
    }
    
    // Kiểm tra giới hạn sử dụng theo người dùng
    if (userId && discount.usageLimitPerUser) {
      const userUsedCount = (discount.usedBy && discount.usedBy[userId]) || 0;
      if (userUsedCount >= discount.usageLimitPerUser) {
        console.log(`[DISCOUNT] User ${userId} has reached usage limit for discount ${_id} (${userUsedCount}/${discount.usageLimitPerUser})`);
        return false;
      }
    }
    
    // Tăng số lần sử dụng toàn cục
    discount.usedCount = (discount.usedCount || 0) + 1;
    
    // Tăng số lần sử dụng theo người dùng (nếu có userId)
    if (userId) {
      console.log(`[DISCOUNT] Incrementing usage for user ${userId}`);
      discount.usedBy = discount.usedBy || {};
      discount.usedBy[userId] = (discount.usedBy[userId] || 0) + 1;
    }

    // Kiểm tra và vô hiệu hóa nếu đạt giới hạn
    if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
      console.log(`[DISCOUNT] Disabling discount ${_id} - reached usage limit (${discount.usedCount}/${discount.usageLimit})`);
      discount.isActive = false;
    }

    // Cập nhật lại vào mảng discounts
    discounts[discountIndex] = discount;
    
    console.log(`[DISCOUNT] Attempting to save updated discount...`);
    const writeSuccess = writeDiscounts(discounts);
    
    if (writeSuccess) {
      console.log(`[DISCOUNT] SUCCESS: Incremented usage for discount ${_id}`);
      console.log(`[DISCOUNT] New state - usedCount: ${discount.usedCount}, isActive: ${discount.isActive}`);
      
      // Verify the change was actually saved
      try {
        const updatedDiscounts = readDiscounts();
        const updatedDiscount = updatedDiscounts.find(d => d._id === _id);
        if (updatedDiscount) {
          console.log(`[DISCOUNT] VERIFY: Current usedCount in file: ${updatedDiscount.usedCount}`);
          if (updatedDiscount.usedCount !== discount.usedCount) {
            console.error(`[DISCOUNT] VERIFY FAILED: Used count mismatch! Expected ${discount.usedCount} but got ${updatedDiscount.usedCount}`);
            return false;
          }
        } else {
          console.error(`[DISCOUNT] VERIFY FAILED: Could not find discount ${_id} after update`);
          return false;
        }
      } catch (verifyError) {
        console.error(`[DISCOUNT] Error verifying update:`, verifyError);
        return false;
      }
      
      return true;
    } else {
      console.error(`[ERROR] Failed to save discount ${_id} after incrementing usage`);
      return false;
    }
  } catch (error) {
    console.error(`[ERROR] Error incrementing discount usage for ${_id}:`, error);
    return false;
  }
}

module.exports = {
  getAllDiscounts,
  getDiscountById,
  getDiscountByCode,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  incrementDiscountUsage,
}; 