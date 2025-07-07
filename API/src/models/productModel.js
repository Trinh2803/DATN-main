const mongoose = require("mongoose");
const Schema = mongoose.Schema;

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
  
}, { timestamps: true })

module.exports = mongoose.model('Product', productSchema)