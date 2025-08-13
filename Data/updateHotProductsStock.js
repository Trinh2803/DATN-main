// Script tự động cập nhật stock cho sản phẩm hot trong Deho.products.json
// Chạy: node updateHotProductsStock.js

const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'Deho.products.json');

const HOT_COUNT = 8; // Số sản phẩm hot cần cập nhật
const NEW_STOCK = 10; // Giá trị stock mới

const raw = fs.readFileSync(filePath, 'utf8');
let products = JSON.parse(raw);

// Sắp xếp sản phẩm theo sellCount giảm dần
products.sort((a, b) => (b.sellCount || 0) - (a.sellCount || 0));

// Lấy top HOT_COUNT sản phẩm hot
const hotProducts = products.slice(0, HOT_COUNT);

// Cập nhật stock cho sản phẩm hot
hotProducts.forEach(product => {
  if (typeof product.stock === 'number') {
    product.stock = NEW_STOCK;
  }
  if (Array.isArray(product.variants)) {
    product.variants.forEach(variant => {
      if (typeof variant.stock === 'number') {
        variant.stock = NEW_STOCK;
      }
    });
  }
});

// Ghi lại file
fs.writeFileSync(filePath, JSON.stringify(products, null, 2), 'utf8');
console.log(`Đã cập nhật stock cho ${HOT_COUNT} sản phẩm hot!`);
