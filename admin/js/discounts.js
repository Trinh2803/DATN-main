let discounts = [];
let editingDiscount = null;

export async function renderDiscounts() {
  const content = document.getElementById("content");
  content.innerHTML = `
    <div class="page-header">
      <h2><i class="fas fa-tag"></i> Quản lý mã giảm giá</h2>
      <button class="btn-primary" onclick="showAddDiscountForm()">
        <i class="fas fa-plus"></i> Thêm mã giảm giá
      </button>
    </div>
    
    <div id="discountList" class="data-table-container">
      <div class="loading">Đang tải dữ liệu...</div>
    </div>
  `;

  await loadDiscounts();
}

async function loadDiscounts() {
  try {
    const response = await fetch('http://localhost:3000/discounts', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    });

    if (!response.ok) {
      throw new Error('Không thể tải danh sách mã giảm giá');
    }

    discounts = await response.json();
    renderDiscountTable();
  } catch (error) {
    console.error('Error loading discounts:', error);
    document.getElementById("discountList").innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        Lỗi khi tải danh sách mã giảm giá: ${error.message}
      </div>
    `;
  }
}

function renderDiscountTable() {
  const discountList = document.getElementById("discountList");
  
  if (discounts.length === 0) {
    discountList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-tag"></i>
        <h3>Chưa có mã giảm giá nào</h3>
        <p>Bắt đầu tạo mã giảm giá đầu tiên để khuyến khích khách hàng mua sắm</p>
        <button class="btn-primary" onclick="showAddDiscountForm()">
          <i class="fas fa-plus"></i> Thêm mã giảm giá
        </button>
      </div>
    `;
    return;
  }

  discountList.innerHTML = `
    <div class="data-table">
      <table>
        <thead>
          <tr>
            <th>Mã</th>
            <th>Tên</th>
            <th>Loại</th>
            <th>Giá trị</th>
            <th>Đơn hàng tối thiểu</th>
            <th>Thời gian</th>
            <th>Sử dụng</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          ${discounts.map(discount => `
            <tr>
              <td><strong>${discount.code}</strong></td>
              <td>${discount.name}</td>
              <td>${discount.discountType === 'percentage' ? 'Phần trăm' : 'Số tiền'}</td>
              <td>${discount.discountType === 'percentage' ? discount.discountValue + '%' : formatCurrency(discount.discountValue)}</td>
              <td>${formatCurrency(discount.minOrderValue)}</td>
              <td>${formatDate(discount.startDate)} - ${formatDate(discount.endDate)}</td>
              <td>${discount.usedCount}/${discount.usageLimit || '∞'}</td>
              <td>
                <span class="status-badge ${discount.isActive ? 'active' : 'inactive'}">
                  ${discount.isActive ? 'Hoạt động' : 'Vô hiệu'}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button class="btn-icon btn-edit" onclick="editDiscount('${discount._id}')" title="Chỉnh sửa">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn-icon btn-toggle" onclick="toggleDiscount('${discount._id}')" title="${discount.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}">
                    <i class="fas fa-${discount.isActive ? 'pause' : 'play'}"></i>
                  </button>
                  <button class="btn-icon btn-delete" onclick="deleteDiscount('${discount._id}')" title="Xóa">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function showAddDiscountForm() {
  editingDiscount = null;
  showDiscountModal();
}

function editDiscount(id) {
  editingDiscount = discounts.find(d => d._id === id);
  showDiscountModal();
}

function showDiscountModal() {
  const modal = document.getElementById("categoryModal");
  const modalBody = document.getElementById("modalBody");
  
  modalBody.innerHTML = `
    <h3>${editingDiscount ? 'Chỉnh sửa mã giảm giá' : 'Thêm mã giảm giá mới'}</h3>
    <form id="discountForm" onsubmit="saveDiscount(event)">
      <div class="form-row">
        <div class="form-group">
          <label for="code">Mã giảm giá *</label>
          <input type="text" id="code" name="code" value="${editingDiscount?.code || ''}" required>
        </div>
        <div class="form-group">
          <label for="name">Tên mã giảm giá *</label>
          <input type="text" id="name" name="name" value="${editingDiscount?.name || ''}" required>
        </div>
      </div>
      
      <div class="form-group">
        <label for="description">Mô tả</label>
        <textarea id="description" name="description">${editingDiscount?.description || ''}</textarea>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="discountType">Loại giảm giá *</label>
          <select id="discountType" name="discountType" required>
            <option value="percentage" ${editingDiscount?.discountType === 'percentage' ? 'selected' : ''}>Phần trăm (%)</option>
            <option value="fixed" ${editingDiscount?.discountType === 'fixed' ? 'selected' : ''}>Số tiền cố định (VNĐ)</option>
          </select>
        </div>
        <div class="form-group">
          <label for="discountValue">Giá trị giảm giá *</label>
          <input type="number" id="discountValue" name="discountValue" value="${editingDiscount?.discountValue || ''}" required min="0">
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="minOrderValue">Giá trị đơn hàng tối thiểu</label>
          <input type="number" id="minOrderValue" name="minOrderValue" value="${editingDiscount?.minOrderValue || 0}" min="0">
        </div>
        <div class="form-group" id="maxDiscountGroup">
          <label for="maxDiscount">Giảm giá tối đa</label>
          <input type="number" id="maxDiscount" name="maxDiscount" value="${editingDiscount?.maxDiscount || ''}" min="0">
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="startDate">Ngày bắt đầu *</label>
          <input type="datetime-local" id="startDate" name="startDate" value="${editingDiscount ? formatDateTimeLocal(editingDiscount.startDate) : ''}" required>
        </div>
        <div class="form-group">
          <label for="endDate">Ngày kết thúc *</label>
          <input type="datetime-local" id="endDate" name="endDate" value="${editingDiscount ? formatDateTimeLocal(editingDiscount.endDate) : ''}" required>
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="usageLimit">Giới hạn sử dụng</label>
          <input type="number" id="usageLimit" name="usageLimit" value="${editingDiscount?.usageLimit || ''}" min="0" placeholder="0 = không giới hạn">
        </div>
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" id="isActive" name="isActive" ${editingDiscount?.isActive !== false ? 'checked' : ''}>
            Kích hoạt mã giảm giá
          </label>
        </div>
      </div>
      
      <div class="form-actions">
        <button type="button" class="btn-secondary" onclick="closeModal()">Hủy</button>
        <button type="submit" class="btn-primary">
          ${editingDiscount ? 'Cập nhật' : 'Thêm mới'}
        </button>
      </div>
    </form>
  `;
  
  // Show/hide max discount field based on discount type
  const discountType = document.getElementById('discountType');
  const maxDiscountGroup = document.getElementById('maxDiscountGroup');
  
  discountType.addEventListener('change', function() {
    maxDiscountGroup.style.display = this.value === 'percentage' ? 'block' : 'none';
  });
  
  // Trigger initial display
  maxDiscountGroup.style.display = discountType.value === 'percentage' ? 'block' : 'none';
  
  modal.style.display = "block";
}

async function saveDiscount(event) {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  const discountData = {
    code: formData.get('code'),
    name: formData.get('name'),
    description: formData.get('description'),
    discountType: formData.get('discountType'),
    discountValue: parseFloat(formData.get('discountValue')),
    minOrderValue: parseFloat(formData.get('minOrderValue')) || 0,
    maxDiscount: formData.get('maxDiscount') ? parseFloat(formData.get('maxDiscount')) : null,
    startDate: formData.get('startDate'),
    endDate: formData.get('endDate'),
    usageLimit: formData.get('usageLimit') ? parseInt(formData.get('usageLimit')) : null,
    isActive: formData.get('isActive') === 'on'
  };

  try {
    const url = editingDiscount 
      ? `http://localhost:3000/discounts/${editingDiscount._id}`
      : 'http://localhost:3000/discounts';
    
    const method = editingDiscount ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify(discountData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Lỗi khi lưu mã giảm giá');
    }

    closeModal();
    await loadDiscounts();
    showNotification(editingDiscount ? 'Cập nhật mã giảm giá thành công' : 'Thêm mã giảm giá thành công', 'success');
  } catch (error) {
    console.error('Error saving discount:', error);
    showNotification(error.message, 'error');
  }
}

async function toggleDiscount(id) {
  try {
    const discount = discounts.find(d => d._id === id);
    const updatedData = { isActive: !discount.isActive };
    
    const response = await fetch(`http://localhost:3000/discounts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify(updatedData)
    });

    if (!response.ok) {
      throw new Error('Lỗi khi cập nhật trạng thái mã giảm giá');
    }

    await loadDiscounts();
    showNotification('Cập nhật trạng thái thành công', 'success');
  } catch (error) {
    console.error('Error toggling discount:', error);
    showNotification(error.message, 'error');
  }
}

async function deleteDiscount(id) {
  if (!confirm('Bạn có chắc chắn muốn xóa mã giảm giá này?')) {
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/discounts/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    });

    if (!response.ok) {
      throw new Error('Lỗi khi xóa mã giảm giá');
    }

    await loadDiscounts();
    showNotification('Xóa mã giảm giá thành công', 'success');
  } catch (error) {
    console.error('Error deleting discount:', error);
    showNotification(error.message, 'error');
  }
}

// Utility functions
function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('vi-VN');
}

function formatDateTimeLocal(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
    <span>${message}</span>
  `;
  
  // Add to page
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Make functions globally available
window.showAddDiscountForm = showAddDiscountForm;
window.editDiscount = editDiscount;
window.saveDiscount = saveDiscount;
window.toggleDiscount = toggleDiscount;
window.deleteDiscount = deleteDiscount; 