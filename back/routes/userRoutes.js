const express = require('express');
const router = express.Router();
const { getCurrentUser, changePassword } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/users/me
// @desc    Get current user information
// @access  Private
router.get('/me', protect, getCurrentUser);

// @route   POST /api/users/me/change-password
// @desc    Change current user password
// @access  Private
router.post('/me/change-password', protect, changePassword);

module.exports = router;