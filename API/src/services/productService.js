const Product = require('../models/productModel');
const fs = require('fs');
const path = require('path');

// Lấy tất cả sản phẩm
const getAllProducts = async ({ categoryId, sortBy, order, name } = {}) => {
  try {
    let query = {
      isVisible: true,
      $or: [
        { quantity: { $gt: 0 } },
        { quantity: { $exists: false } }
      ]
    };
    
    if (categoryId) {
      query.categoryId = categoryId;
    }
    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }

    let sort = {};
    if (sortBy === 'price' && order) {
      sort.price = order === 'asc' ? 1 : -1;
    }

    return await Product.find(query).sort(sort).lean();
  } catch (err) {
    throw new Error('Không thể lấy sản phẩm: ' + err.message);
  }
};

// Lấy sản phẩm mới
const getNewProducts = async (limit) => {
  try {
    const products = await Product
      .find({ isVisible: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return products;
  } catch (err) {
    throw new Error('Không thể lấy sản phẩm mới: ' + err.message);
  }
};

// Lấy sản phẩm giảm giá
const getSaleProducts = async (limit) => {
  try {
    const products = await Product.find({ isVisible: true })
      .aggregate([
        {
          $match: {
            $and: [
              { salePrice: { $exists: true, $ne: 0 } },
              {
                $or: [
                  { quantity: { $gt: 0 } },
                  { quantity: { $exists: false } }
                ]
              }
            ]
          }
        },
        {
          $addFields: {
            discountPercentage: {
              $multiply: [
                { $divide: [{ $subtract: ['$price', '$salePrice'] }, '$price'] },
                100
              ]
            }
          }
        },
        {
          $sort: {
            discountPercentage: -1
          }
        },
        {
          $limit: limit
        },
        {
          $project: {
            discountPercentage: 0
          }
        }
      ])
      .exec();
    return products;
  } catch (err) {
    throw new Error('Không thể lấy sản phẩm sale: ' + err.message);
  }
};

// Lấy sản phẩm theo ID
const getProductById = async (id) => {
  try {
    const product = await Product.findById(id).lean();
    if (!product) throw new Error('Không tìm thấy sản phẩm');
    return product;
  } catch (err) {
    throw new Error('Không thể lấy sản phẩm: ' + err.message);
  }
};

// Thêm sản phẩm
const createProduct = async (data) => {
  try {
    return await Product.create(data);
  } catch (err) {
    throw new Error('Không thể tạo sản phẩm: ' + err.message);
  }
};

// Cập nhật sản phẩm
const updateProduct = async (id, data, newFiles) => {
  try {
    const product = await Product.findById(id);
    if (!product) throw new Error('Không tìm thấy sản phẩm');

    // Nếu có ảnh thumbnail mới → xóa ảnh cũ
    if (newFiles?.thumbnail && product.thumbnail) {
      const oldThumbPath = path.join(__dirname, '..', 'public', product.thumbnail);
      if (fs.existsSync(oldThumbPath)) fs.unlinkSync(oldThumbPath);
      data.thumbnail = `/images/products/${newFiles.thumbnail[0].filename}`; // Thêm /products/
    }

    // Nếu có ảnh images mới → xóa ảnh cũ
    if (newFiles?.images && product.images?.length) {
      product.images.forEach(img => {
        const imgPath = path.join(__dirname, '..', 'public', img);
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      });
      data.images = newFiles.images.map(file => `/images/products/${file.filename}`); // Thêm /products/
    }

    return await Product.findByIdAndUpdate(id, data, { new: true }).lean();
  } catch (err) {
    throw new Error('Không thể cập nhật sản phẩm: ' + err.message);
  }
};

// Xóa sản phẩm + ảnh
const deleteProduct = async (id) => {
  try {
    const product = await Product.findById(id);
    if (!product) throw new Error('Không tìm thấy sản phẩm');

    // Xóa thumbnail
    if (product.thumbnail) {
      const thumbPath = path.join(__dirname, '..', 'public', product.thumbnail);
      if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
    }

    // Xóa images
    if (product.images?.length) {
      product.images.forEach(img => {
        const imgPath = path.join(__dirname, '..', 'public', img);
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      });
    }

    return await Product.findByIdAndDelete(id);
  } catch (err) {
    throw new Error('Không thể xóa sản phẩm: ' + err.message);
  }
};

const updateSellCount = async (productId, quantity) => {
  try {
    // Kiểm tra xem sản phẩm có tồn tại không
    const product = await Product.findById(productId);
    if (!product) throw new Error('Sản phẩm không tồn tại');
    
    // Kiểm tra nếu quantity không hợp lệ
    if (quantity <= 0) {
      throw new Error('Số lượng không hợp lệ, không thể cập nhật');
    }

    // Cập nhật `sellCount` trong một bước duy nhất
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: productId },
      { $inc: { sellCount: quantity } },  // Cập nhật `sellCount` với số lượng đã điều chỉnh
      { new: true }  // Trả về document đã được cập nhật
    );

    console.log(`Updated sellCount for product: ${productId}, new sellCount: ${updatedProduct.sellCount}`);
  } catch (err) {
    console.error('Error updating sellCount:', err);
    throw new Error('Không thể cập nhật sellCount: ' + err.message);
  }
};
// ✅ Lấy sản phẩm hot (bán chạy nhất)
const getHotProducts = async (limit) => {
  try {
    const query = { isVisible: true };
    const products = await Product.aggregate([
      // Lọc sản phẩm còn hàng (quantity > 0 hoặc không có quantity)
      {
        $match: {
          $or: [
            { quantity: { $gt: 0 } },
            { quantity: { $exists: false } }
          ]
        }
      },
      // Sắp xếp sản phẩm theo `sellCount` giảm dần
      { $sort: { sellCount: -1 } },

      // Giới hạn số lượng sản phẩm cần lấy
      { $limit: limit },

      // Populate categoryId
      {
        $lookup: {
          from: 'categories', // Tên collection của Category
          localField: 'categoryId',
          foreignField: '_id',
          as: 'categoryId'
        }
      },
      {
        $unwind: {
          path: '$categoryId',
          preserveNullAndEmptyArrays: true // Giữ lại sản phẩm nếu không có category
        }
      },

      // Chỉ trả về các trường cần thiết
      {
        $project: {
          name: 1,
          slug: 1,
          price: 1,
          salePrice: 1,
          thumbnail: 1,
          sellCount: 1,
          description: 1, // Thêm description để khớp với ProductInterface
          createdAt: 1,   // Thêm createdAt
          categoryId: {
            _id: '$categoryId._id',
            name: '$categoryId.name'
          }
        }
      }
    ]);

    return products;
  } catch (err) {
    throw new Error('Không thể lấy sản phẩm hot: ' + err.message);
  }
};
// Cập nhật số lượng tồn kho sản phẩm
const updateProductStock = async (productId, quantity) => {
  try {
    // Tìm sản phẩm theo ID
    const product = await Product.findById(productId);
    
    if (!product) {
      console.error(`[PRODUCT] Không tìm thấy sản phẩm với ID: ${productId}`);
      return { success: false, message: 'Không tìm thấy sản phẩm' };
    }
    
    // Kiểm tra nếu sản phẩm có biến thể (variants)
    if (product.variants && product.variants.length > 0) {
      // Nếu có biến thể, không cập nhật stock ở cấp sản phẩm cha
      return { 
        success: false, 
        message: 'Sản phẩm có biến thể, vui lòng cập nhật stock cho từng biến thể' 
      };
    }
    
    // Kiểm tra số lượng tồn kho
    if (product.stock < quantity) {
      return { 
        success: false, 
        message: 'Số lượng tồn kho không đủ',
        currentStock: product.stock
      };
    }
    
    // Cập nhật số lượng tồn kho
    product.stock -= quantity;
    await product.save();
    
    console.log(`[PRODUCT] Đã cập nhật tồn kho sản phẩm ${productId}. Số lượng còn lại: ${product.stock}`);
    return { 
      success: true, 
      message: 'Cập nhật tồn kho thành công',
      currentStock: product.stock
    };
    
  } catch (error) {
    console.error(`[PRODUCT] Lỗi khi cập nhật tồn kho sản phẩm ${productId}:`, error);
    return { 
      success: false, 
      message: 'Lỗi khi cập nhật tồn kho: ' + error.message 
    };
  }
};

// Cập nhật tồn kho cho nhiều sản phẩm trong đơn hàng
const updateProductsStock = async (items) => {
  try {
    const results = [];
    
    for (const item of items) {
      const result = await updateProductStock(item.productId, item.quantity);
      results.push({
        productId: item.productId,
        ...result
      });
    }
    
    // Kiểm tra xem có lỗi nào không
    const hasErrors = results.some(result => !result.success);
    
    return {
      success: !hasErrors,
      results: results,
      message: hasErrors ? 'Một số sản phẩm cập nhật tồn kho không thành công' : 'Cập nhật tồn kho thành công'
    };
    
  } catch (error) {
    console.error('[ORDER] Lỗi khi cập nhật tồn kho đơn hàng:', error);
    return {
      success: false,
      message: 'Lỗi khi cập nhật tồn kho đơn hàng: ' + error.message
    };
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getNewProducts,
  getSaleProducts,
  updateSellCount,
  getHotProducts,
  updateProductStock,
  updateProductsStock
};