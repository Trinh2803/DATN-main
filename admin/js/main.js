import { renderCategories } from "./categories.js";
import { renderProducts } from "./products.js";
import { renderUsersByRole } from "./users.js";
import { renderOrders } from "./orders.js";

let currentTab = "dashboard";

document.addEventListener("DOMContentLoaded", () => {
  const content = document.getElementById("content");

  const buttons = [
    { id: "btnCategories", action: () => { currentTab = "category"; renderCategories(); } },
    { id: "btnProducts", action: () => { currentTab = "product"; renderProducts(); } },
    { id: "btnDashboard", action: () => { currentTab = "dashboard"; renderDashboard(); } },
    { id: "btnAdmins", action: () => { currentTab = "admin"; renderUsersByRole("admin"); } },
    { id: "btnCustomers", action: () => { currentTab = "customer"; renderUsersByRole("customer"); } },
    { id: "btnOrders", action: () => { currentTab = "order"; renderOrders(); } }

  ];

  buttons.forEach(({ id, action }) => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener("click", () => {
        buttons.forEach(({ id }) => document.getElementById(id)?.classList.remove("active"));
        btn.classList.add("active");
        content.innerHTML = "<p>Đang tải...</p>";
        action();
      });
    }
  });

  // Toggle submenu
  const userMenuBtn = document.getElementById("btnUserMenu");
  const userSubmenu = document.getElementById("userSubmenu");

  userMenuBtn.addEventListener("click", () => {
    userMenuBtn.parentElement.classList.toggle("active");
  });
});

function renderDashboard() {
  const content = document.getElementById("content");
  content.innerHTML = `
    <h2>Tổng quan</h2>
    <p>Chào mừng đến trang quản trị!</p>
  `;
}
