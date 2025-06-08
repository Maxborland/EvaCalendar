const express = require('express');
const router = express.Router();
const {
  getCurrentUser,
  changePassword,
  getAllUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  changeUserRole,
  adminChangeUserPassword,
  updateEmailNotificationSettings,
  searchUsers
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');
const taskController = require('../controllers/taskController.js');


// @route   GET /api/users/assignable
// @desc    Get all users that can be assigned to a task
// @access  Private
router.get('/assignable', protect, (req, res, next) => {
    // Находим нужный обработчик в экспортированном роутере
    const assignableUsersHandler = taskController.stack.find(layer => layer.route && layer.route.path === '/assignable-users' && layer.route.methods.get);
    if (assignableUsersHandler) {
        assignableUsersHandler.handle(req, res, next);
    } else {
        res.status(404).send('Not Found');
    }
});

// @route   GET /api/users/search
// @desc    Search for users by username
// @access  Private
router.get('/search', protect, searchUsers);

// @route   GET /api/users/me
// @desc    Get current user information
// @access  Private
router.get('/me', protect, getCurrentUser);

// @route   POST /api/users/me/change-password
// @desc    Change current user password
// @access  Private
router.post('/me/change-password', protect, changePassword);

// @route   PUT /api/users/me/settings/email-notifications
// @desc    Update user's email notification settings
// @access  Private
router.put('/me/settings/email-notifications', protect, updateEmailNotificationSettings);

// @route   GET /api/users
// @desc    Get all users
// @access  Private (Admin)
router.get('/', protect, authorize(['admin']), getAllUsers);

// @route   POST /api/users
// @desc    Create a new user
// @access  Private (Admin)
router.post('/', protect, authorize(['admin']), createUser);

// @route   GET /api/users/:uuid
// @desc    Get user by UUID
// @access  Private (Admin)
router.get('/:uuid', protect, authorize(['admin']), getUserById);

// @route   PUT /api/users/:uuid
// @desc    Update user by UUID
// @access  Private (Admin)
router.put('/:uuid', protect, authorize(['admin']), updateUser);

// @route   DELETE /api/users/:uuid
// @desc    Delete user by UUID
// @access  Private (Admin)
router.delete('/:uuid', protect, authorize(['admin']), deleteUser);

// @route   PUT /api/users/:userUuid/role
// @desc    Change user role by UUID
// @access  Private (Admin)
router.put('/:userUuid/role', protect, authorize(['admin']), changeUserRole);

// @route   PUT /api/users/:userUuid/password
// @desc    Admin changes user password by UUID
// @access  Private (Admin)
router.put('/:userUuid/password', protect, authorize(['admin']), adminChangeUserPassword);

module.exports = router;