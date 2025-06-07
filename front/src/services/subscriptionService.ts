import api from './api';

/**
 * Converts a VAPID public key string from URL-safe base64 to a Uint8Array.
 * @param {string} base64String The VAPID public key.
 * @returns {Uint8Array} The VAPID public key as a Uint8Array.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Retrieves the current push subscription.
 * @returns {Promise<PushSubscription | null>} The current subscription or null.
 */
export async function getSubscription(): Promise<PushSubscription | null> {
    const registration = await navigator.serviceWorker.ready;
    return registration.pushManager.getSubscription();
}

/**
 * Subscribes the user to push notifications.
 * Requests permission, gets the VAPID key, creates a subscription,
 * and sends it to the backend.
 */
export async function subscribeUser(): Promise<void> {
    const registration = await navigator.serviceWorker.ready;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
        throw new Error('Permission not granted for Notification');
    }

    const { data: { publicKey } } = await api.get('/api/subscriptions/vapid-public-key');
    const applicationServerKey = urlBase64ToUint8Array(publicKey);

    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
    });

    await api.post('/api/subscriptions', subscription);
}

/**
 * Unsubscribes the user from push notifications.
 * Gets the current subscription, unsubscribes, and informs the backend.
 */
export async function unsubscribeUser(): Promise<void> {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
        await subscription.unsubscribe();
        const encodedEndpoint = encodeURIComponent(subscription.endpoint);
        await api.delete(`/api/subscriptions/${encodedEndpoint}`);
    }
}
/**
 * Sends a test notification to the current user's subscription.
 */
export async function sendTestNotification(): Promise<void> {
    console.log('Attempting to send a test notification...');
    await api.post('/api/notifications/test');
    console.log('Successfully requested to send a test notification.');
}