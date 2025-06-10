const knex = require('../db.cjs');
const { v4: uuidv4 } = require('uuid');

const TABLE_NAME = 'notification_subscriptions';

const subscribe = async (userId, subscription) => {
  const { endpoint, keys } = subscription;
  const existingSubscription = await knex(TABLE_NAME)
    .where({ endpoint: endpoint })
    .first();

  if (existingSubscription) {
    // Если подписка уже существует, можно обновить ее ключи или просто вернуть существующую
    return knex(TABLE_NAME)
      .where({ uuid: existingSubscription.uuid })
      .update({
        user_id: userId, // Обновляем user_id на случай, если подписка была, но без пользователя
        keys: JSON.stringify(keys),
        updated_at: knex.fn.now(),
      });
  } else {
    // Создаем новую подписку
    const newUuid = uuidv4();
    return knex(TABLE_NAME).insert({
      uuid: newUuid,
      user_id: userId,
      endpoint: endpoint,
      keys: JSON.stringify(keys),
    });
  }
};

const unsubscribe = async (endpoint) => {
  return knex(TABLE_NAME)
    .where({ endpoint: endpoint })
    .del();
};
const getVapidPublicKey = () => {
  if (!process.env.VAPID_PUBLIC_KEY) {
    throw new Error('VAPID public key is not defined in environment variables.');
  }
  return process.env.VAPID_PUBLIC_KEY;
};

const getSubscriptionStatus = async (userUuid) => {
  const subscription = await knex(TABLE_NAME)
    .where({ user_id: userUuid })
    .first();
  return !!subscription;
};

module.exports = {
  subscribe,
  unsubscribe,
  getVapidPublicKey,
  getSubscriptionStatus,
};