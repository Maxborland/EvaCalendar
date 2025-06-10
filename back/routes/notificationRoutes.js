const express = require('express');
const router = express.Router();
const {
  sendTestNotification,
  sendTestEmailNotification,
  subscribe,
  unsubscribe,
  getSubscriptions,
  getVapidPublicKey,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware.js');

router.post('/test', protect, sendTestNotification);
router.post('/test-notification', protect, sendTestNotification);
router.post('/test-email', protect, sendTestEmailNotification);

router.post('/subscribe', protect, subscribe);
router.post('/unsubscribe', protect, unsubscribe);
router.get('/subscriptions', protect, getSubscriptions);

router.get('/vapid-public-key', getVapidPublicKey);

module.exports = router;