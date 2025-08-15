require('dotenv').config(); // load .env trước tiên
const mongoose = require('mongoose');
const News = require('../models/tintuc');

// Dữ liệu chèn vào trước khi connect
const newsData = [
  {
    title: 'Tiêu đề tin tức 1',
    image: 'http://localhost:3000/images/news1.jpg',
    description: 'Mô tả ngắn về tin tức 1.',
    date: '2025-08-15',
    category: 'Media',
  },
  {
    title: 'Tiêu đề tin tức 2',
    image: 'http://localhost:3000/images/news2.jpg',
    description: 'Mô tả ngắn về tin tức 2.',
    date: '2025-08-14',
    category: 'News',
  },
];

console.log('MongoDB URI:', process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('Connected to MongoDB');
    console.log('Inserting data:', newsData);
    return News.insertMany(newsData);
  })
  .then(() => {
    console.log('Data inserted successfully.');
    return mongoose.connection.db.listCollections({ name: 'news' }).toArray();
  })
  .then((collections) => {
    console.log('Collections found:', collections);
    mongoose.connection.close();
  })
  .catch((err) => {
    console.error('Error inserting data:', err);
  });
