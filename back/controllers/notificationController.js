const asyncHandler = require('express-async-handler');
const notificationService = require('../services/notificationService');
const emailService = require('../services/emailService');
const knex = require('../db.cjs');

const sendTestNotification = asyncHandler(async (req, res) => {
  const userId = req.user.uuid; // Исправлено на uuid
  await notificationService.sendTestNotification(userId);
  res.status(200).json({ message: 'Test notification sent successfully.' });
});

const sendTestEmailNotification = asyncHandler(async (req, res) => {
    const user = await knex('users').where({ uuid: req.user.uuid }).first();
    if (!user) {
        res.status(404);
        throw new Error('User not found.');
    }

    const payload = {
        title: 'Тестовое Email-уведомление',
        body: 'Это тестовое уведомление от EvaCalendar, отправленное на вашу почту.',
    };

    await emailService.sendEmail(
        user.email,
        payload.title,
        payload.body,
        `<p>${payload.body}</p>`
    );

    res.status(200).json({ message: 'Test email notification sent successfully.' });
});

module.exports = {
  sendTestNotification,
  sendTestEmailNotification,
};