import { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import TopNavigator from '../components/TopNavigator';
import {
  getSubscription,
  sendTestNotification,
  subscribeUser
} from '../services/subscriptionService';

const SettingsPage = () => {
  const navigate = useNavigate();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isPushSupported, setIsPushSupported] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsPushSupported(true);
      const checkSubscription = async () => {
        const subscription = await getSubscription();
        setIsSubscribed(!!subscription);
      };
      checkSubscription();
    }
  }, []);

  const handleGoBack = () => {
    navigate('/', { replace: true });
  };

  const handleSubscribe = async () => {
    if (!isPushSupported) {
      console.error('Push-уведомления не поддерживаются этим браузером.');
      return;
    }
    try {
      await subscribeUser();
      setIsSubscribed(true);
      console.log('Пользователь успешно подписан.');
    } catch (error) {
      console.error('Не удалось подписаться:', error);
    }
  };

  const handleSendTestNotification = async () => {
    console.log('Button clicked!');
    try {
      await sendTestNotification();
      console.log('Тестовое уведомление отправлено.');
    } catch (error) {
      console.error('Не удалось отправить тестовое уведомление:', error);
    }
  };

  return (
    <div className="text-white flex flex-col min-h-screen">
      <TopNavigator title="Настройки" showButtons={false} />

      <main className="flex-grow p-6 pb-24">
        <nav className="space-y-4">
          <Link
            to="/settings/expense-categories"
            className="block bg-slate-800 hover:bg-slate-700 p-4 rounded-lg shadow transition-colors duration-200"
          >
            <h2 className="text-lg font-medium">Категории расходов</h2>
            <p className="text-sm text-slate-400">
              Управление категориями расходов для отслеживания финансов.
            </p>
          </Link>
          <Link
            to="/settings/child-cards"
            className="block bg-slate-800 hover:bg-slate-700 p-4 rounded-lg shadow transition-colors duration-200"
          >
            <h2 className="text-lg font-medium">Детские карточки</h2>
            <p className="text-sm text-slate-400">
              Настройка и управление карточками детей.
            </p>
          </Link>
        </nav>

        {/* Раздел управления уведомлениями */}
        <div className="mt-8 bg-slate-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Управление уведомлениями</h2>
          <div className="space-y-4">
            <button
              onClick={handleSubscribe}
              disabled={isSubscribed || !isPushSupported}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              {isSubscribed
                ? 'Вы подписаны'
                : 'Подписаться на уведомления'}
            </button>
            <button
              onClick={handleSendTestNotification}
              disabled={!isSubscribed || !isPushSupported}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Отправить тестовое уведомление
            </button>
          </div>
          {!isPushSupported && (
            <p className="text-red-400 text-sm mt-4">
              Push-уведомления не поддерживаются в вашем браузере.
            </p>
          )}
        </div>

        <div className="mt-8">
          <Outlet />
        </div>
      </main>

      <footer className="p-4 fixed bottom-0 left-0 right-0 bg-transparent flex justify-start items-center">
        <button
          onClick={handleGoBack}
          className="flex items-center text-sm text-slate-300 hover:text-white transition-colors w-1/2 justify-center py-3 bg-slate-800 hover:bg-slate-700 rounded-lg"
          aria-label="Go back"
        >
          <span className="material-icons mr-2 text-lg">arrow_back</span>
          Назад
        </button>
        {/* <p className="mt-4 text-center text-xs text-slate-500"></p> Пустой тег удален */}
      </footer>
    </div>
  );
};

export default SettingsPage;