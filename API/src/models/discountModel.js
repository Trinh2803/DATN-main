const fs = require('fs');
const path = require('path');

const DISCOUNT_FILE = path.join(__dirname, '../../../Data/Deho.discounts.json');

function readDiscounts() {
  console.log(`[DEBUG] Reading discounts from: ${DISCOUNT_FILE}`);
  if (!fs.existsSync(DISCOUNT_FILE)) {
    console.log('[DEBUG] Discounts file does not exist, returning empty array');
    return [];
  }
  const data = fs.readFileSync(DISCOUNT_FILE, 'utf-8');
  console.log(`[DEBUG] Raw discounts data:`, data);
  const result = data ? JSON.parse(data) : [];
  console.log(`[DEBUG] Parsed discounts:`, JSON.stringify(result, null, 2));
  return result;
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

/**
 * Tăng số lần sử dụng mã giảm giá
 * @param {string} _id - ID của mã giảm giá
 * @param {string} userId - ID của người dùng (nếu có)
 * @returns {Promise<boolean>} - Trả về true nếu tăng thành công, false nếu thất bại
 */
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
    
    // Tạo bản sao sâu của đối tượng discount để tránh tham chiếu
    const discount = JSON.parse(JSON.stringify(discounts[discountIndex]));
    
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
    
    // Kiểm tra thời hạn sử dụng mã
    if ((startDate && now < startDate) || (endDate && now > endDate)) {
      console.log(`[DISCOUNT] Discount ${_id} is not within valid date range`);
      console.log(`[DISCOUNT] Now: ${now}, Start: ${startDate}, End: ${endDate}`);
      return false;
    }
    
    // Kiểm tra trạng thái kích hoạt
    if (discount.isActive === false) {
      console.log(`[DISCOUNT] Discount ${_id} is not active`);
      return false;
    }
    
    // Khởi tạo usedCount nếu chưa có
    discount.usedCount = discount.usedCount || 0;
    
    // Kiểm tra giới hạn sử dụng toàn cục
    if (typeof discount.usageLimit === 'number' && discount.usageLimit > 0) {
      if (discount.usedCount >= discount.usageLimit) {
        console.log(`[DISCOUNT] Cannot increment - discount ${_id} has reached usage limit (${discount.usedCount}/${discount.usageLimit})`);
        // Tự động vô hiệu hóa nếu đạt giới hạn
        if (discount.isActive) {
          console.log(`[DISCOUNT] Auto-disabling discount ${_id} - reached usage limit`);
          discount.isActive = false;
          // Cập nhật vào cơ sở dữ liệu
          discounts[discountIndex] = discount;
          writeDiscounts(discounts);
        }
        return false;
      }
    }
    
    // Kiểm tra giới hạn sử dụng theo người dùng
    if (userId && typeof discount.usageLimitPerUser === 'number' && discount.usageLimitPerUser > 0) {
      // Khởi tạo usedBy nếu chưa có
      discount.usedBy = discount.usedBy || {};
      const userUsedCount = discount.usedBy[userId] || 0;
      
      if (userUsedCount >= discount.usageLimitPerUser) {
        console.log(`[DISCOUNT] User ${userId} has reached usage limit for discount ${_id} (${userUsedCount}/${discount.usageLimitPerUser})`);
        return false;
      }
    }
    
    // Tăng số lần sử dụng toàn cục
    discount.usedCount++;
    
    // Tăng số lần sử dụng theo người dùng (nếu có userId)
    if (userId) {
      console.log(`[DISCOUNT] Incrementing usage for user ${userId}`);
      discount.usedBy = discount.usedBy || {};
      discount.usedBy[userId] = (discount.usedBy[userId] || 0) + 1;
    }

    // Kiểm tra và vô hiệu hóa nếu đạt giới hạn
    if (typeof discount.usageLimit === 'number' && discount.usageLimit > 0 && 
        discount.usedCount >= discount.usageLimit) {
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
      
      // Xác minh dữ liệu đã được lưu thành công
      try {
        const updatedDiscounts = readDiscounts();
        const updatedDiscount = updatedDiscounts.find(d => d._id === _id);
        if (updatedDiscount) {
          console.log(`[DISCOUNT] VERIFY: Current usedCount in file: ${updatedDiscount.usedCount}`);
          if (updatedDiscount.usedCount !== discount.usedCount) {
            console.error(`[DISCOUNT] VERIFY FAILED: Used count mismatch! Expected ${discount.usedCount} but got ${updatedDiscount.usedCount}`);
            // Thử ghi lại nếu xác minh thất bại
            return writeDiscounts(discounts);
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

/**
 * Atomically updates discount usage with proper locking to prevent race conditions
 * @param {string} _id - Discount ID
 * @param {string} userId - User ID (optional)
 * @returns {Promise<{success: boolean, discount: object}>} - Result of the operation
 */
async function atomicUpdateDiscountUsage(_id, userId) {
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    let discounts;
    let discountIndex;
    let discount;
    
    try {
      // Read current state
      discounts = readDiscounts();
      discountIndex = discounts.findIndex(d => d._id === _id);
      
      if (discountIndex === -1) {
        return { success: false, error: 'Mã giảm giá không tồn tại', code: 'NOT_FOUND' };
      }
      
      // Tạo bản sao để tránh thay đổi trực tiếp
      discount = JSON.parse(JSON.stringify(discounts[discountIndex]));
      
      // Kiểm tra ngày hiệu lực
      const now = new Date();
      const startDate = discount.startDate ? new Date(discount.startDate) : null;
      const endDate = discount.endDate ? new Date(discount.endDate) : null;
      
      // Kiểm tra ngày hiệu lực
      if ((startDate && now < startDate) || (endDate && now > endDate)) {
        return { 
          success: false, 
          error: 'Mã giảm giá không nằm trong thời gian áp dụng',
          code: 'INVALID_DATE_RANGE'
        };
      }
      
      // Kiểm tra trạng thái kích hoạt
      if (discount.isActive === false) {
        return { 
          success: false, 
          error: 'Mã giảm giá không còn khả dụng',
          code: 'DISCOUNT_INACTIVE'
        };
      }
      
      // Khởi tạo bộ đếm nếu cần
      discount.usedCount = discount.usedCount || 0;
      discount.usedBy = discount.usedBy || {};
      
      // Kiểm tra giới hạn sử dụng toàn cục
      if (typeof discount.usageLimit === 'number' && discount.usageLimit > 0) {
        // Kiểm tra nếu đã đạt hoặc vượt quá giới hạn
        if (discount.usedCount >= discount.usageLimit) {
          // Tự động vô hiệu hóa nếu đạt giới hạn
          if (discount.isActive) {
            console.log(`[DISCOUNT] Auto-disabling discount ${discount.code} - reached usage limit`);
            discount.isActive = false;
            discounts[discountIndex] = discount;
            writeDiscounts(discounts);
          }
          return { 
            success: false, 
            error: 'Mã giảm giá đã đạt giới hạn sử dụng',
            code: 'USAGE_LIMIT_REACHED'
          };
        }
        
        // Kiểm tra nếu lần tăng này sẽ vượt quá giới hạn
        if (discount.usedCount + 1 > discount.usageLimit) {
          console.log(`[DISCOUNT] Rejecting discount ${discount.code} - would exceed usage limit`);
          return {
            success: false,
            error: 'Mã giảm giá đã đạt giới hạn sử dụng',
            code: 'USAGE_LIMIT_REACHED'
          };
        }
      }
      
      // Check per-user limit if user is logged in
      if (userId) {
        const userUsedCount = discount.usedBy[userId] || 0;
        const userLimit = discount.usageLimitPerUser || discount.perUserLimit || discount.usageLimit;
        
        if (userLimit > 0 && userUsedCount >= userLimit) {
          return {
            success: false,
            error: 'Bạn đã sử dụng hết số lần được phép',
            code: 'USER_LIMIT_REACHED'
          };
        }
      }
      
      // Nếu đến đây, mã giảm giá có thể được sử dụng
      // Tăng bộ đếm toàn cục và kiểm tra lại lần cuối để tránh race condition
      const newUsedCount = (discount.usedCount || 0) + 1;
      
      // Kiểm tra lại sau khi đã tăng để đảm bảo không vượt quá giới hạn
      if (discount.usageLimit && newUsedCount > discount.usageLimit) {
        console.log(`[DISCOUNT] Race condition detected for ${discount.code} - rejecting`);
        return {
          success: false,
          error: 'Mã giảm giá đã đạt giới hạn sử dụng',
          code: 'USAGE_LIMIT_REACHED'
        };
      }
      
      // Cập nhật bộ đếm
      discount.usedCount = newUsedCount;
      
      // Tăng bộ đếm cho người dùng nếu có đăng nhập
      if (userId) {
        discount.usedBy = discount.usedBy || {};
        discount.usedBy[userId] = (discount.usedBy[userId] || 0) + 1;
      }
      
      // Tự động vô hiệu hóa nếu đạt giới hạn
      if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
        console.log(`[DISCOUNT] Auto-disabling discount ${discount.code} - reached usage limit (${discount.usedCount}/${discount.usageLimit})`);
        discount.isActive = false;
      }
      
      // Update the discount in the array
      discounts[discountIndex] = discount;
      
      // Ghi thay đổi
      try {
        const writeSuccess = writeDiscounts(discounts);
        if (writeSuccess) {
          console.log(`[DISCOUNT] Successfully applied discount ${discount.code}. New used count: ${discount.usedCount}`);
          return { success: true, discount };
        } else {
          console.error(`[DISCOUNT] Failed to write discount changes for ${discount.code}`);
          return { 
            success: false, 
            error: 'Không thể cập nhật thông tin mã giảm giá',
            code: 'WRITE_ERROR'
          };
        }
      } catch (error) {
        console.error(`[DISCOUNT] Error writing discount changes for ${discount.code}:`, error);
        return { 
          success: false, 
          error: 'Lỗi khi cập nhật thông tin mã giảm giá',
          code: 'WRITE_ERROR',
          details: error.message
        };
      }
      
    } catch (error) {
      console.error(`[ERROR] Attempt ${retryCount + 1} failed:`, error);
    }
    
    retryCount++;
    if (retryCount < maxRetries) {
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return { 
    success: false, 
    error: 'Failed to update discount after multiple attempts',
    code: 'UPDATE_FAILED'
  };
}

module.exports = {
  getAllDiscounts,
  getDiscountById,
  getDiscountByCode,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  incrementDiscountUsage,
  atomicUpdateDiscountUsage,
}; 