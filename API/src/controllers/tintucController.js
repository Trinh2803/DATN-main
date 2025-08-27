// controllers/tintucController.js
const News = require('../models/tintuc');

// Lấy tất cả tin tức với phân trang
exports.getAllNews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 5;
    const skip = (page - 1) * pageSize;

    const total = await News.countDocuments();
    const newsList = await News.find()
      .skip(skip)
      .limit(pageSize);

    const news = newsList.map(item => ({
      id: item._id.toString(),
      title: item.title,
      image: item.image,
      description: item.description,
      date: item.date,
      category: item.category,
    }));

    res.json({
      news,
      totalPages: Math.ceil(total / pageSize),
      currentPage: page,
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách tin tức: ' + err.message });
  }
};

// Lấy tin tức theo ID
exports.getNewsById = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) {
      return res.status(404).json({ message: 'Không tìm thấy tin tức' });
    }
    res.json({
      id: news._id.toString(),
      title: news.title,
      image: news.image,
      description: news.description,
      date: news.date,
      category: news.category,
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy tin tức: ' + err.message });
  }
};