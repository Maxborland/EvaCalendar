const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware.js');

router.post('/test', protect, notificationController.sendTestNotification);
router.post('/test-email', protect, notificationController.sendTestEmailNotification);

module.exports = router;