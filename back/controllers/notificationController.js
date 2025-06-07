const notificationService = require('../services/notificationService');

const sendTestNotification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await notificationService.sendTestNotification(userId);
    res.status(200).json({ message: 'Test notification sent successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendTestNotification,
};