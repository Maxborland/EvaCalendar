const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController.js');
const asyncHandler = require('express-async-handler'); // Для обработки асинхронных ошибок
const { protect } = require('../middleware/authMiddleware.js'); // Импортируем middleware

// POST /api/auth/register
router.post('/register', asyncHandler(authController.registerUser));

// POST /api/auth/login
router.post('/login', asyncHandler(authController.loginUser));

// POST /api/auth/logout
router.post('/logout', protect, authController.logoutUser); // Защищаем роут и используем logoutUser

// Другие роуты аутентификации (refresh-token) могут быть добавлены здесь позже

module.exports = router;