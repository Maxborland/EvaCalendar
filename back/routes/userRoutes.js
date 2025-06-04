const express = require('express');
const router = express.Router();
const {
  getCurrentUser,
  changePassword,
  getAllUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

// @route   GET /api/users/me
// @desc    Get current user information
// @access  Private
router.get('/me', protect, getCurrentUser);

// @route   POST /api/users/me/change-password
// @desc    Change current user password
// @access  Private
router.post('/me/change-password', protect, changePassword);

// @route   GET /api/users
// @desc    Get all users
// @access  Private (Admin)
router.get('/', protect, authorize(['admin']), getAllUsers);

// @route   POST /api/users
// @desc    Create a new user
// @access  Private (Admin)
router.post('/', protect, authorize(['admin']), createUser);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (Admin)
router.get('/:id', protect, authorize(['admin']), getUserById);

// @route   PUT /api/users/:id
// @desc    Update user by ID
// @access  Private (Admin)
router.put('/:id', protect, authorize(['admin']), updateUser);

// @route   DELETE /api/users/:id
// @desc    Delete user by ID
// @access  Private (Admin)
router.delete('/:id', protect, authorize(['admin']), deleteUser);

module.exports = router;