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

const subscribe = asyncHandler(async (req, res, next) => {
  try {
    const { subscription } = req.body;
    const user_uuid = req.user.uuid;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ message: 'Subscription object is required.' });
    }

    const createdSubscription = await notificationService.createPushSubscription(user_uuid, subscription);
    res.status(201).json(createdSubscription);
  } catch (error) {
    next(error);
  }
});

const unsubscribe = asyncHandler(async (req, res, next) => {
  try {
    const { endpoint } = req.body;
    const user_uuid = req.user.uuid;

    if (!endpoint) {
      return res.status(400).json({ message: 'Endpoint is required.' });
    }

    await notificationService.deletePushSubscription(user_uuid, endpoint);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

const getSubscriptions = async (req, res, next) => {
  try {
    const user_uuid = req.user.uuid;
    const subscriptions = await notificationService.getSubscriptionsByUserId(user_uuid);
    res.status(200).json(subscriptions);
  } catch (error) {
    next(error);
  }
};

const getVapidPublicKey = asyncHandler(async (req, res) => {
  res.status(200).json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

module.exports = {
  sendTestNotification,
  sendTestEmailNotification,
  subscribe,
  unsubscribe,
  getSubscriptions,
  getVapidPublicKey,
};