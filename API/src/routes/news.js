const express = require('express');
const router = express.Router();
const newsController = require('../controllers/tintucController');

router.get('/', newsController.getAllNews);
router.get('/:id', newsController.getNewsById);

module.exports = router;