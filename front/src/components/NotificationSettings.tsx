import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getVapidPublicKey, sendTestNotification, subscribeToNotifications, unsubscribeFromNotifications } from '../services/notificationService';
import { getUserSettings, updateEmailNotificationSettings } from '../services/userService';
import './NotificationSettings.css';

const urlBase64ToUint8Array = (base64String: string) => {
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

const NotificationSettings = () => {
    const [settings, setSettings] = useState({
        emailEnabled: false,
        pushEnabled: false,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isPushSupported, setIsPushSupported] = useState(false);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        const checkSupportAndFetchData = async () => {
            setIsLoading(true);
            const pushSupported = 'serviceWorker' in navigator && 'PushManager' in window;
            setIsPushSupported(pushSupported);

            try {
                const userSettings = await getUserSettings();
                const emailEnabled = userSettings?.email_notifications_enabled || false;
                let pushEnabled = false;

                if (pushSupported) {
                    const registration = await navigator.serviceWorker.ready;
                    const pushSubscription = await registration.pushManager.getSubscription();
                    pushEnabled = !!pushSubscription;
                }

                setSettings({ emailEnabled, pushEnabled });
            } catch (err) {
                toast.error('Не удалось загрузить настройки уведомлений.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        checkSupportAndFetchData();
    }, []);

    const handleEmailToggle = async () => {
        try {
            const updatedSettings = await updateEmailNotificationSettings(!settings.emailEnabled);
            setSettings(prev => ({ ...prev, emailEnabled: updatedSettings.email_notifications_enabled }));
            toast.success('Настройки email-уведомлений успешно обновлены.');
        } catch (err) {
            toast.error('Не удалось обновить настройки email-уведомлений.');
            console.error(err);
        }
    };

    const handlePushToggle = async () => {
        if (!isPushSupported) {
            toast.error('Push-уведомления не поддерживаются.');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            const pushSubscription = await registration.pushManager.getSubscription();

            if (pushSubscription) {
                await handleUnsubscribe(pushSubscription);
            } else {
                await handleSubscribe();
            }
        } catch (err) {
            toast.error('Не удалось изменить статус подписки на push-уведомления.');
            console.error(err);
        }
    };

    const handleSubscribe = async () => {
        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                toast.error('Разрешение на получение уведомлений не было получено.');
                return;
            }

            const vapidPublicKey = await getVapidPublicKey();
            const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

            const registration = await navigator.serviceWorker.ready;
            const newSubscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey,
            });

            await subscribeToNotifications(newSubscription);
            setSettings(prev => ({ ...prev, pushEnabled: true }));
            toast.success('Вы успешно подписались на push-уведомления.');

        } catch (err) {
            toast.error('Не удалось подписаться на push-уведомления.');
            console.error(err);
            setSettings(prev => ({ ...prev, pushEnabled: false }));
        }
    };

    const handleUnsubscribe = async (subscription: PushSubscription) => {
        try {
            await subscription.unsubscribe();
            await unsubscribeFromNotifications(subscription.endpoint);
            setSettings(prev => ({ ...prev, pushEnabled: false }));
            toast.success('Вы успешно отписались от push-уведомлений.');
        } catch (err) {
            toast.error('Не удалось отписаться от push-уведомлений.');
            console.error(err);
        }
    };

    const handleSendTestNotification = async () => {
        setIsSending(true);
        try {
            await sendTestNotification();
            toast.success('Тестовое уведомление успешно отправлено.');
        } catch (error) {
            toast.error('Не удалось отправить тестовое уведомление.');
            console.error(error);
        } finally {
            setIsSending(false);
        }
    };

    if (isLoading) {
        return <div>Загрузка...</div>;
    }

    return (
        <div className="notification-settings">
            <h2>Настройки уведомлений</h2>

            <div className="setting-item">
                <span>Email-уведомления</span>
                <label className="toggle-switch">
                    <input
                        id="email-toggle"
                        type="checkbox"
                        checked={settings.emailEnabled}
                        onChange={handleEmailToggle}
                    />
                    <span className="slider"></span>
                </label>
            </div>

            {isPushSupported && (
                <div className="setting-item">
                    <span>Push-уведомления</span>
                    <label className="toggle-switch">
                        <input
                            id="push-toggle"
                            type="checkbox"
                            checked={settings.pushEnabled}
                            onChange={handlePushToggle}
                        />
                        <span className="slider"></span>
                    </label>
                </div>
            )}

            <div className="setting-item">
                <button
                    onClick={handleSendTestNotification}
                    disabled={(!settings.emailEnabled && !settings.pushEnabled) || isSending}
                    className="test-notification-btn"
                >
                    Отправить тестовое уведомление
                </button>
            </div>

        </div>
    );
};

export default NotificationSettings;