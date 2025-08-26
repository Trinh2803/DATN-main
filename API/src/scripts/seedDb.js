const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Discount = require('../models/discountModel');

async function loadJson(file) {
  const p = path.join(__dirname, '..', '..', 'Data'.replace('..',''), '..');
}

async function readJson(relPath) {
  const p = path.join(__dirname, '..', '..', '..', 'Data', relPath);
  const raw = fs.readFileSync(p, 'utf8');
  return JSON.parse(raw);
}

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/deho';
  await mongoose.connect(uri);
  console.log('[SEED] Connected to', uri);

  const products = await readJson('Deho.products.json').catch(()=>[]);
  const categories = await readJson('Deho.categories.json').catch(()=>[]);
  const discounts = await readJson('Deho.discounts.json').catch(()=>[]);

  if (categories.length) {
    await Category.deleteMany({});
    await Category.insertMany(categories);
    console.log('[SEED] Categories:', categories.length);
  } else {
    console.warn('[SEED] No categories json found');
  }

  if (products.length) {
    await Product.deleteMany({});
    await Product.insertMany(products);
    console.log('[SEED] Products:', products.length);
  } else {
    console.warn('[SEED] No products json found');
  }

  if (discounts.length) {
    await Discount.deleteMany({});
    await Discount.insertMany(discounts);
    console.log('[SEED] Discounts:', discounts.length);
  } else {
    console.warn('[SEED] No discounts json found');
  }

  await mongoose.disconnect();
  console.log('[SEED] Done');
}

main().catch(err => {
  console.error('[SEED] Error:', err);
  process.exit(1);
});


