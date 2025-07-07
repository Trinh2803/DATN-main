const productsURL = "http://localhost:3000/products";

export async function renderProducts() {
  try {
    const res = await fetch(productsURL);
    const json = await res.json();
    const products = json.data;

    const content = document.getElementById("content");
    content.innerHTML = `
      <h2>Quản lý sản phẩm</h2>
      <div class="search-add">
    <input type="text" id="searchProductInput" placeholder="🔍 Tìm sản phẩm..." />

        <button id="addProductBtn">➕ Thêm sản phẩm</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>STT</th>
            <th>Tên</th>
            <th>Giá</th>
            <th>Giảm</th>
            <th>Ảnh</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          ${products.map((p, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${p.name}</td>
              <td>${p.price.toLocaleString()}đ</td>
              <td>${p.salePrice?.toLocaleString() || '0'}đ</td>
              <td><img src="${p.thumbnail}" width="50" /></td>
              <td>
                <button class="editBtn" data-id="${p._id}">Sửa</button>
                <button class="deleteBtn" data-id="${p._id}">Xóa</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
    document.getElementById("searchProductInput").oninput = (e) => {
      const keyword = e.target.value.trim().toLowerCase();
      const rows = document.querySelectorAll("tbody tr");
    
      rows.forEach((row) => {
        const name = row.children[1].textContent.toLowerCase();
        row.style.display = name.includes(keyword) ? "table-row" : "none";
      });
    };
    
    document.getElementById("addProductBtn").onclick = showAddProductForm;
    document.querySelectorAll(".editBtn").forEach(btn => btn.onclick = () => showEditProductForm(btn.dataset.id));
    document.querySelectorAll(".deleteBtn").forEach(btn => btn.onclick = () => deleteProduct(btn.dataset.id));
  } catch (err) {
    console.error("Lỗi khi tải sản phẩm:", err);
  }
}

function openModal(contentHTML) {
  document.getElementById("modalBody").innerHTML = contentHTML;
  document.getElementById("categoryModal").style.display = "block";
}
function closeModal() {
  document.getElementById("categoryModal").style.display = "none";
}
window.closeModal = closeModal;

// Thêm sản phẩm
function showAddProductForm() {
  openModal(`
    <h3>Thêm sản phẩm mới</h3>
    <form id="addProductForm" enctype="multipart/form-data">
      <input name="name" placeholder="Tên sản phẩm" required />
      <input name="slug" placeholder="Slug" required />
      <input name="description" placeholder="Mô tả" required />
      <input name="price" type="number" placeholder="Giá" required />
      <input name="salePrice" type="number" placeholder="Giá giảm" />
      <input name="categoryId" placeholder="ID danh mục" required />

      <label>Thumbnail</label>
      <input type="file" name="thumbnail" required />
      <label>Hình ảnh chi tiết</label>
      <input type="file" name="images" multiple />

      <button type="submit">Thêm</button>
    </form>
  `);

  document.getElementById("addProductForm").onsubmit = handleAddProduct;
}

async function handleAddProduct(e) {
  e.preventDefault();
  const formData = new FormData(e.target);

  try {
    const res = await fetch(`${productsURL}/add`, {
      method: "POST",
      body: formData
    });
    const result = await res.json();
    if (result.success) {
      alert("✅ Đã thêm sản phẩm");
      closeModal();
      renderProducts();
    } else throw new Error(result.message);
  } catch (err) {
    alert("❌ " + err.message);
  }
}

// Sửa sản phẩm
async function showEditProductForm(id) {
  try {
    const res = await fetch(productsURL);
    const json = await res.json();
    const product = json.data.find(p => p._id === id);

    openModal(`
      <h3>Sửa sản phẩm</h3>
      <form id="editProductForm" enctype="multipart/form-data">
        <input name="name" value="${product.name}" required />
        <input name="slug" value="${product.slug}" required />
        <input name="description" value="${product.description}" required />
        <input name="price" type="number" value="${product.price}" required />
        <input name="salePrice" type="number" value="${product.salePrice || 0}" />
        <input name="categoryId" value="${product.categoryId}" required />

        <input type="hidden" name="oldThumbnail" value="${product.thumbnail}" />
        <input type="hidden" name="oldImages" value="${product.images.join(',')}" />

        <label>Thumbnail (nếu đổi)</label>
        <input type="file" name="thumbnail" />
        <label>Ảnh chi tiết (nếu đổi)</label>
        <input type="file" name="images" multiple />

        <button type="submit">Cập nhật</button>
      </form>
    `);

    document.getElementById("editProductForm").onsubmit = (e) => handleEditProduct(e, id);
  } catch (err) {
    alert("Lỗi tải sản phẩm");
  }
}

async function handleEditProduct(e, id) {
  e.preventDefault();
  const formData = new FormData(e.target);

  try {
    const res = await fetch(`${productsURL}/${id}`, {
      method: "PUT",
      body: formData
    });
    const result = await res.json();
    if (result.success) {
      alert("✅ Cập nhật thành công");
      closeModal();
      renderProducts();
    } else throw new Error(result.message);
  } catch (err) {
    alert("❌ " + err.message);
  }
}

// Xoá sản phẩm
async function deleteProduct(id) {
  if (!confirm("Bạn có chắc muốn xoá sản phẩm này?")) return;

  try {
    const res = await fetch(`${productsURL}/${id}`, {
      method: "DELETE"
    });
    const result = await res.json();
    if (result.success) {
      alert("✅ Đã xoá");
      renderProducts();
    } else throw new Error(result.message);
  } catch (err) {
    alert("❌ " + err.message);
  }
}

