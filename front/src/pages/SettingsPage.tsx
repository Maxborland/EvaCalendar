import { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import TopNavigator from '../components/TopNavigator';
import { useAuth } from '../context/AuthContext';
import {
  getSubscription,
  sendTestEmailNotification,
  sendTestNotification,
  subscribeUser,
  unsubscribeUser
} from '../services/subscriptionService';
import { getUserSettings, updateEmailNotificationSettings } from '../services/userService';

const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent);

const SettingsPage = () => {
  const navigate = useNavigate();
  const { isSubscribed, updateSubscriptionStatus } = useAuth();
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [isEmailSubscribed, setIsEmailSubscribed] = useState(false);
  const [showIOSNotice, setShowIOSNotice] = useState(false);

  useEffect(() => {
    const onIOS = isIOS();
    setShowIOSNotice(onIOS);

    if (!onIOS && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsPushSupported(true);
    }

    const fetchUserSettings = async () => {
      try {
        const settings = await getUserSettings();
        setIsEmailSubscribed(settings.email_notifications_enabled);
      } catch (error) {
        console.error('Не удалось получить настройки пользователя:', error);
      }
    };

    fetchUserSettings();
  }, []);

  useEffect(() => {
    if (isPushSupported) {
      const checkSubscription = async () => {
        try {
          const subscription = await getSubscription();
          updateSubscriptionStatus(!!subscription);
        } catch (error) {
          console.error('Ошибка при получении статуса подписки:', error);
          updateSubscriptionStatus(false);
        }
      };
      checkSubscription();
    }
  }, [isPushSupported, updateSubscriptionStatus]);

  const handleGoBack = () => {
    navigate('/', { replace: true });
  };

  const handleSubscribe = async () => {
    if (!isPushSupported) return;
    try {
      await subscribeUser();
      updateSubscriptionStatus(true);
    } catch (error) {
      console.error('Не удалось подписаться:', error);
    }
  };

  const handleUnsubscribe = async () => {
    try {
      await unsubscribeUser();
      updateSubscriptionStatus(false);
    } catch (error) {
      console.error('Не удалось отписаться:', error);
    }
  };

  const handleEmailSubToggle = async () => {
    try {
      await updateEmailNotificationSettings(!isEmailSubscribed);
      setIsEmailSubscribed(!isEmailSubscribed);
    } catch (error) {
      console.error('Не удалось обновить настройки email-уведомлений:', error);
    }
  };

  const handleSendTestNotification = async () => {
    try {
      await sendTestNotification();
    } catch (error) {
      console.error('Не удалось отправить тестовое уведомление:', error);
    }
  };

  const renderPushNotificationControls = () => (
    <>
      <div className="space-y-4">
        {isSubscribed ? (
          <button onClick={handleUnsubscribe} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg">
            Отписаться от Push-уведомлений
          </button>
        ) : (
          <button onClick={handleSubscribe} disabled={!isPushSupported} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg">
            Подписаться на Push-уведомления
          </button>
        )}
        <button onClick={handleSendTestNotification} disabled={!isSubscribed} className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg">
          Отправить тестовое Push-уведомление
        </button>
      </div>
      {!isPushSupported && <p className="text-red-400 text-sm mt-4">Push-уведомления не поддерживаются в вашем браузере.</p>}
    </>
  );

  const renderEmailNotificationControls = () => (
    <div className="space-y-4">
       <p className="text-sm text-slate-400">
         Ваше устройство не поддерживает push-уведомления. Вместо этого вы можете получать уведомления по почте.
       </p>
      <button onClick={handleEmailSubToggle} className={`w-full font-bold py-3 px-4 rounded-lg ${isEmailSubscribed ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
        {isEmailSubscribed ? 'Отписаться от Email-уведомлений' : 'Подписаться на Email-уведомления'}
      </button>
      {isEmailSubscribed && (
          <button onClick={sendTestEmailNotification} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg">
              Отправить тестовое Email-уведомление
          </button>
      )}
    </div>
  );

  return (
    <div className="text-white flex flex-col min-h-screen">
      <TopNavigator title="Настройки" showButtons={false} />

      <main className="flex-grow p-6 pb-24">
        <nav className="space-y-4">
          <Link to="/settings/expense-categories" className="block bg-slate-800 hover:bg-slate-700 p-4 rounded-lg">
            <h2 className="text-lg font-medium">Категории расходов</h2>
            <p className="text-sm text-slate-400">Управление категориями расходов.</p>
          </Link>
          <Link to="/settings/child-cards" className="block bg-slate-800 hover:bg-slate-700 p-4 rounded-lg">
            <h2 className="text-lg font-medium">Детские карточки</h2>
            <p className="text-sm text-slate-400">Настройка карточек детей.</p>
          </Link>
        </nav>

        <div className="mt-8 bg-slate-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Управление уведомлениями</h2>
          {showIOSNotice ? renderEmailNotificationControls() : renderPushNotificationControls()}
        </div>

        <div className="mt-8">
          <Outlet />
        </div>
      </main>

      <footer className="p-4 fixed bottom-0 left-0 right-0 bg-transparent flex justify-start items-center">
        <button onClick={handleGoBack} className="flex items-center text-sm text-slate-300 hover:text-white w-1/2 justify-center py-3 bg-slate-800 hover:bg-slate-700 rounded-lg">
          <span className="material-icons mr-2 text-lg">arrow_back</span>
          Назад
        </button>
      </footer>
    </div>
  );
};

export default SettingsPage;