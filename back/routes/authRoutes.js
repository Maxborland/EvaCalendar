const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController.js');
const asyncHandler = require('express-async-handler');
const { protect } = require('../middleware/authMiddleware.js');

// POST /api/auth/register
router.post('/register', asyncHandler(authController.registerUser));

// POST /api/auth/login
router.post('/login', asyncHandler(authController.loginUser));

// POST /api/auth/logout
router.post('/logout', authController.logoutUser);

module.exports = router;