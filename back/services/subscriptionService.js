const knex = require('../db.cjs');

const TABLE_NAME = 'notification_subscriptions';

const createSubscription = async (userId, subscription) => {
  const { endpoint, keys } = subscription;
  const existingSubscription = await knex(TABLE_NAME)
    .where({ endpoint: endpoint })
    .first();

  if (existingSubscription) {
    // Если подписка уже существует, можно обновить ее ключи или просто вернуть существующую
    return knex(TABLE_NAME)
      .where({ id: existingSubscription.id })
      .update({
        user_id: userId, // Обновляем user_id на случай, если подписка была, но без пользователя
        keys: JSON.stringify(keys),
        updated_at: knex.fn.now(),
      });
  } else {
    // Создаем новую подписку
    return knex(TABLE_NAME).insert({
      user_id: userId,
      endpoint: endpoint,
      keys: JSON.stringify(keys),
    });
  }
};

const deleteSubscription = async (userId, endpoint) => {
  return knex(TABLE_NAME)
    .where({ user_id: userId, endpoint: endpoint })
    .del();
};
const getVapidPublicKey = () => {
  if (!process.env.VAPID_PUBLIC_KEY) {
    throw new Error('VAPID public key is not defined in environment variables.');
  }
  return process.env.VAPID_PUBLIC_KEY;
};

module.exports = {
  createSubscription,
  deleteSubscription,
  getVapidPublicKey,
};