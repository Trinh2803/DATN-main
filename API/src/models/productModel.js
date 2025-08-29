const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Schema cho biến thể sản phẩm
const variantSchema = new Schema({
  id: { type: String, required: true },
  size: { type: String, required: true },
  price: { type: Number, required: true },
  salePrice: { type: Number },
  stock: { type: Number, default: 0 }
});

const productSchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  salePrice: { type: Number },
  thumbnail: { type: String },
  sellCount: { type: Number, default: 0 },
  images: [String],
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'categories' },
  variants: [variantSchema], // Thêm trường variants
  discountId: { type: mongoose.Schema.Types.ObjectId, ref: 'discounts' }, // Thêm trường discountId
  isVisible: { type: Boolean, default: true } // Thêm trường isVisible
}, { timestamps: true })

module.exports = mongoose.model('Product', productSchema)