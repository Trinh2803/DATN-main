const fs = require('fs');
const path = require('path');

const newsPath = path.join(__dirname, '../../../Data/Deho.news.json');
let news = [];

try {
  const data = fs.readFileSync(newsPath, 'utf8');
  news = JSON.parse(data);
} catch (err) {
  console.error('Error reading news data:', err);
}

module.exports = news; 