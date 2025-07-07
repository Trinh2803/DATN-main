const categoriesURL = "http://localhost:3000/categories";

export async function renderCategories() {
  try {
    const res = await fetch(categoriesURL);
    const json = await res.json();
    const categories = json.data;

    const content = document.getElementById("content");
    content.innerHTML = `
      <h2>Quản lý danh mục</h2>
      <div class="search-add">
          <input type="text" id="searchCategoryInput" placeholder="🔍 Tìm danh mục..." />

        <button id="addCategoryBtn">➕ Thêm danh mục</button>
      </div>

      <table>
        <thead>
          <tr><th>STT</th><th>Tên</th><th>Slug</th><th>Hình ảnh</th><th>Hành động</th></tr>
        </thead>
        <tbody>
          ${categories.map((c, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${c.name}</td>
              <td>${c.slug}</td>
              <td><img src="${c.image}" width="50" /></td>
              <td>
                <button class="editBtn" data-id="${c._id}">Sửa</button>
                <button class="deleteBtn" data-id="${c._id}">Xóa</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;

    document.getElementById("addCategoryBtn").onclick = showAddForm;
    document.querySelectorAll(".editBtn").forEach(btn => btn.onclick = () => showEditForm(btn.dataset.id));
    document.querySelectorAll(".deleteBtn").forEach(btn => btn.onclick = () => deleteCategory(btn.dataset.id));
  } catch (err) {
    console.error("Lỗi khi tải danh mục:", err);
  }
  document.getElementById("searchCategoryInput").oninput = (e) => {
    const keyword = e.target.value.trim().toLowerCase();
    const rows = document.querySelectorAll("tbody tr");
  
    rows.forEach((row) => {
      const name = row.children[1].textContent.toLowerCase();
      row.style.display = name.includes(keyword) ? "table-row" : "none";
    });
  };
  
}

// ------------------- FORM POPUP --------------------

function openModal(contentHTML) {
  document.getElementById("modalBody").innerHTML = contentHTML;
  document.getElementById("categoryModal").style.display = "block";
}

function closeModal() {
  document.getElementById("categoryModal").style.display = "none";
}

window.closeModal = closeModal;   


function showAddForm() {
  openModal(`
    <h3 style="margin-bottom: 10px;">Thêm danh mục mới</h3>
    <form id="addForm" enctype="multipart/form-data">
      <label>Tên danh mục</label>
      <input name="name" placeholder="Tên danh mục" required />

      <label>Slug</label>
      <input name="slug" placeholder="Slug" required />

      <label>Hình ảnh</label>
      <input type="file" name="image" required />

      <button type="submit">Thêm</button>
    </form>
  `);
  document.getElementById("addForm").onsubmit = handleAddSubmit;
}

// Gửi form thêm
async function handleAddSubmit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);

  try {
    const res = await fetch(`${categoriesURL}/add`, {
      method: "POST",
      body: formData,
    });
    const result = await res.json();
    if (result.success) {
      alert("✅ Thêm thành công");
      closeModal();
      renderCategories();
    } else throw new Error(result.message);
  } catch (err) {
    alert("❌ " + err.message);
  }
}

// Hiển thị form sửa
async function showEditForm(id) {
  try {
    const res = await fetch(categoriesURL);
    const json = await res.json();
    const category = json.data.find(c => c._id === id);

    openModal(`
      <h3>Sửa danh mục</h3>
      <form id="editForm">
        <input name="name" value="${category.name}" required />
        <input name="slug" value="${category.slug}" required />
        <input type="hidden" name="oldImage" value="${category.image}" />
        <input type="file" name="image" />
        <button type="submit">Cập nhật</button>
      </form>
    `);
    document.getElementById("editForm").onsubmit = (e) => handleEditSubmit(e, id);
  } catch (err) {
    alert("Không thể lấy thông tin danh mục");
  }
}

// Gửi form sửa
async function handleEditSubmit(e, id) {
  e.preventDefault();
  const formData = new FormData(e.target);

  try {
    const res = await fetch(`${categoriesURL}/update/${id}`, {
      method: "PUT",
      body: formData,
    });
    const result = await res.json();
    if (result.success) {
      alert("✅ Cập nhật thành công");
      closeModal();
      renderCategories();
    } else throw new Error(result.message);
  } catch (err) {
    alert("❌ " + err.message);
  }
}

// Xóa danh mục
async function deleteCategory(id) {
  if (!confirm("Bạn có chắc muốn xóa danh mục này?")) return;
  try {
    const res = await fetch(`${categoriesURL}/delete/${id}`, {
      method: "DELETE",
    });
    const result = await res.json();
    if (result.success) {
      alert("✅ Đã xóa");
      renderCategories();
    } else throw new Error(result.message);
  } catch (err) {
    alert("❌ " + err.message);
  }
}
