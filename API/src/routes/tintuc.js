const express = require('express');
const router = express.Router();
const tintucController = require('../controllers/tintucController');

// Lấy danh sách tin tức
router.get('/', tintucController.getAllNews);

// Lấy tin tức theo ID
router.get('/:id', tintucController.getNewsById);

module.exports = router;