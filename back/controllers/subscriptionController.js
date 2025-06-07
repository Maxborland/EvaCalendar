const subscriptionService = require('../services/subscriptionService.js');
const ApiError = require('../utils/ApiError.js');

const createSubscription = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const subscription = req.body;

    if (!userId || !subscription || !subscription.endpoint) {
      throw new ApiError(400, 'User ID and subscription data are required.');
    }

    await subscriptionService.createSubscription(userId, subscription);
    res.status(201).json({ message: 'Subscription created successfully.' });
  } catch (error) {
    next(error);
  }
};

const deleteSubscription = async (req, res, next) => {
  try {
    const { endpoint } = req.params;
    const userId = req.user.id;

    if (!endpoint) {
      throw new ApiError(400, 'Endpoint is required.');
    }

    const decodedEndpoint = decodeURIComponent(endpoint);
    await subscriptionService.deleteSubscription(userId, decodedEndpoint);
    res.status(200).json({ message: 'Subscription deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

const getVapidPublicKey = (req, res, next) => {
  try {
    const publicKey = subscriptionService.getVapidPublicKey();
    res.send(publicKey);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSubscription,
  deleteSubscription,
  getVapidPublicKey,
};