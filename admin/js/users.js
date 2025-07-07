const usersURL = "http://localhost:3000/users";

// ===== RENDER USER THEO ROLE =====
export async function renderUsersByRole(role) {
  try {
    const res = await fetch(usersURL);
    const json = await res.json();
    const users = json.data.filter(u => u.role === role);

    const title = role === "admin" ? "Quản trị viên" : "Khách hàng";

    const content = document.getElementById("content");
    content.innerHTML = `
      <h2>${title}</h2>
      <div class="search-add">
        <input type="text" id="searchUserInput" placeholder="🔍 Tìm ${title.toLowerCase()}..." />
      </div>

      <table>
        <thead>
          <tr><th>STT</th><th>Tên</th><th>Email</th><th>SĐT</th><th>Hành động</th></tr>
        </thead>
        <tbody>
          ${users.map((u, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${u.name}</td>
              <td>${u.email}</td>
              <td>${u.phone}</td>
              <td><button class="editBtn" data-id="${u._id}">Sửa</button></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;

    // Tìm kiếm realtime
    document.getElementById("searchUserInput").oninput = (e) => {
      const keyword = e.target.value.trim().toLowerCase();
      const rows = document.querySelectorAll("tbody tr");
      rows.forEach(row => {
        const name = row.children[1].textContent.toLowerCase();
        row.style.display = name.includes(keyword) ? "table-row" : "none";
      });
    };

    // Gán nút sửa
    document.querySelectorAll(".editBtn").forEach(btn => {
      btn.onclick = () => showEditUserForm(btn.dataset.id);
    });

  } catch (err) {
    console.error("❌ Lỗi khi tải danh sách người dùng:", err);
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

// ===== SỬA NGƯỜI DÙNG =====
async function showEditUserForm(id) {
  try {
    const res = await fetch(`${usersURL}/${id}`);
    const json = await res.json();
    const user = json.data;

    openModal(`
      <h3>Sửa người dùng</h3>
      <form id="editUserForm">
        <label>Tên</label>
        <input name="name" value="${user.name}" required />

        <label>SĐT</label>
        <input name="phone" value="${user.phone}" required />

        <label>Phân quyền</label>
        <select name="role" required>
          <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Quản trị</option>
          <option value="customer" ${user.role === 'customer' ? 'selected' : ''}>Khách hàng</option>
        </select>

        <button type="submit">Cập nhật</button>
      </form>
    `);

    document.getElementById("editUserForm").onsubmit = (e) => handleEditUser(e, id);
  } catch (err) {
    alert("❌ Không thể lấy thông tin người dùng");
  }
}

async function handleEditUser(e, id) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  try {
    const res = await fetch(`${usersURL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (result.success) {
      alert("✅ Cập nhật người dùng thành công");
      closeModal();
      renderUsersByRole(data.role); // reload theo đúng loại người dùng
    } else throw new Error(result.message);
  } catch (err) {
    alert("❌ " + err.message);
  }
}
