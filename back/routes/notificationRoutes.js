const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.post(
  '/test',
  protect,
  notificationController.sendTestNotification
);

module.exports = router;