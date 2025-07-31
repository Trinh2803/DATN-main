const news = require('../models/newsModel');

exports.getAllNews = (req, res) => {
  res.json(news);
}; 