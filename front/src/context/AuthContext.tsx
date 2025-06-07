import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import LoadingAnimation from '../components/LoadingAnimation';
import api from '../services/api';
import { loadSubscriptionStatus, saveSubscriptionStatus } from '../services/subscriptionService';

// Типы
interface User {
  uuid: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSubscribed: boolean;
}

interface AuthContextType extends AuthState {
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateSubscriptionStatus: (isSubscribed: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);

  // Функция для очистки состояния
  const clearAuthState = useCallback(() => {
    localStorage.removeItem('token');
    // saveSubscriptionStatus(false); // Больше не сбрасываем статус подписки при выходе
    if (api.defaults.headers.common['Authorization']) {
        api.defaults.headers.common['Authorization'] = '';
    }
    setUser(null);
    setIsAuthenticated(false);
    setIsSubscribed(false);
  }, []);

  const checkSubscriptionStatus = useCallback(async () => {
    try {
      const { data } = await api.get<{ isSubscribed: boolean }>('/subscriptions/status');
      updateSubscriptionStatus(data.isSubscribed);
    } catch (error) {
      console.error('Failed to check subscription status', error);
      updateSubscriptionStatus(false); // В случае ошибки считаем, что не подписан
    }
  }, []);

  // Эффект для проверки токена при монтировании компонента
  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          const response = await api.get<User>('/users/me');
          setUser(response.data);
          setIsAuthenticated(true);
          await checkSubscriptionStatus(); // Проверяем статус подписки на сервере
        } catch (error) {
          console.error('[AuthContext] verifyToken: Invalid token.', error);
          clearAuthState();
        }
      }
      setIsInitializing(false);
    };

    verifyToken();
  }, [clearAuthState, checkSubscriptionStatus]);

  // Улучшенная функция login
  const login = async (loggedInUser: User, token: string) => {
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(loggedInUser);
    setIsAuthenticated(true);
    await checkSubscriptionStatus(); // Проверяем статус подписки при логине
  };

  // Улучшенная функция logout
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('[AuthContext] logout: API call failed', error);
    } finally {
      clearAuthState();
      setIsLoading(false);
    }
  }, [clearAuthState]);

  const updateSubscriptionStatus = useCallback((status: boolean) => {
    setIsSubscribed(status);
    saveSubscriptionStatus(status);
  }, []);
  // Синхронизация между вкладками
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'token' && event.newValue === null) {
        clearAuthState();
      }
      if (event.key === 'isSubscribed') {
        setIsSubscribed(loadSubscriptionStatus());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [clearAuthState, updateSubscriptionStatus]);


  // Пока идет инициализация, показываем глобальный лоадер
  if (isInitializing) {
    return <LoadingAnimation />;
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, isSubscribed, login, logout, updateSubscriptionStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};