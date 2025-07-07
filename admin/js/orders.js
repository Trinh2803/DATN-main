const ordersURL = "http://localhost:3000/orders";

// ===== HIỂN THỊ DANH SÁCH ĐƠN HÀNG =====
export async function renderOrders() {
  try {
    const res = await fetch(ordersURL);
    const json = await res.json();
    const orders = json.data;

    const content = document.getElementById("content");
    content.innerHTML = `
      <h2>Quản lý đơn hàng</h2>
      <table>
        <thead>
          <tr><th>STT</th><th>Khách hàng</th><th>Email</th><th>Trạng thái</th><th>Ngày</th><th>Hành động</th></tr>
        </thead>
        <tbody>
          ${orders.map((o, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${o.customerName}</td>
              <td>${o.customerEmail}</td>
              <td>${o.status}</td>
              <td>${new Date(o.createdAt).toLocaleString()}</td>
              <td>
                <button class="viewBtn" data-id="${o._id}">Xem</button>
                <button class="editStatusBtn" data-id="${o._id}">Sửa trạng thái</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;

    // Gắn nút xem chi tiết
    document.querySelectorAll(".viewBtn").forEach(btn => {
      btn.onclick = () => showOrderDetails(btn.dataset.id);
    });

    // Gắn nút sửa trạng thái
    document.querySelectorAll(".editStatusBtn").forEach(btn => {
      btn.onclick = () => showEditStatusForm(btn.dataset.id);
    });

  } catch (err) {
    console.error("❌ Lỗi khi tải đơn hàng:", err);
  }
}

// ===== FORM POPUP =====
function openModal(contentHTML) {
  document.getElementById("modalBody").innerHTML = contentHTML;
  document.getElementById("categoryModal").style.display = "block";
}
function closeModal() {
  document.getElementById("categoryModal").style.display = "none";
}
window.closeModal = closeModal;

// ===== XEM CHI TIẾT ĐƠN HÀNG =====
async function showOrderDetails(id) {
  try {
    const res = await fetch(`${ordersURL}/${id}`);
    const json = await res.json();
    const order = json.data;

    openModal(`
      <div class="order-details">
        <h3>Chi tiết đơn hàng #${order._id}</h3>
        <p><strong>Khách hàng:</strong> ${order.customerName}</p>
        <p><strong>Email:</strong> ${order.customerEmail}</p>
        <p><strong>SĐT:</strong> ${order.customerPhone}</p>
        <p><strong>Địa chỉ:</strong> ${order.customerAddress}</p>
        <p><strong>Ghi chú:</strong> ${order.customerNote || 'Không có'}</p>

        <table>
          <thead>
            <tr><th>Sản phẩm</th><th>Số lượng</th><th>Giá</th></tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td>${item.productId?.name || 'Sản phẩm đã xoá'}</td>
                <td>${item.quantity}</td>
                <td>${item.price.toLocaleString()}đ</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <p class="total">Tổng cộng: ${order.total.toLocaleString()}đ</p>
        <p><strong>Trạng thái:</strong> ${order.status}</p>
        <p><strong>Ghi chú của admin:</strong> ${order.adminNote || 'Không có'}</p>
      </div>
    `);

  } catch (err) {
    alert("❌ Không thể tải chi tiết đơn hàng");
  }
}

// ===== SỬA TRẠNG THÁI ĐƠN HÀNG =====
async function showEditStatusForm(id) {
  try {
    const res = await fetch(`${ordersURL}/${id}`);
    const json = await res.json();
    const order = json.data;

    openModal(`
      <h3>Sửa trạng thái đơn hàng</h3>
      <form id="editStatusForm">
        <label>Trạng thái</label>
        <select name="status" required>
          ${['Chờ xác nhận', 'Đang chuẩn bị', 'Đang giao', 'Đã giao', 'Đã hủy'].map(status => `
            <option value="${status}" ${status === order.status ? 'selected' : ''}>${status}</option>
          `).join('')}
        </select>

        <label>Ghi chú admin</label>
        <textarea name="adminNote">${order.adminNote || ''}</textarea>

        <button type="submit">Cập nhật</button>
      </form>
    `);

    document.getElementById("editStatusForm").onsubmit = (e) => handleEditStatus(e, id);

  } catch (err) {
    alert("❌ Không thể tải đơn hàng");
  }
}

async function handleEditStatus(e, id) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  try {
    const res = await fetch(`${ordersURL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (result.success) {
      alert("✅ Cập nhật trạng thái thành công");
      closeModal();
      renderOrders();
    } else throw new Error(result.message);
  } catch (err) {
    alert("❌ " + err.message);
  }
}
