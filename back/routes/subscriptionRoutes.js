const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { protect } = require('../middleware/authMiddleware.js');

router.get('/vapid-public-key', subscriptionController.getVapidPublicKey);
router.post('/', protect, subscriptionController.createSubscription);
router.delete('/:endpoint', protect, subscriptionController.deleteSubscription);

module.exports = router;