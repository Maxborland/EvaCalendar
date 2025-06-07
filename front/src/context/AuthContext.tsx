import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import LoadingAnimation from '../components/LoadingAnimation';
import api from '../services/api';

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
  isLoading: boolean; // Этот флаг теперь будет отражать ТОЛЬКО процесс логина/логаута, а не инициализацию
}

interface AuthContextType extends AuthState {
  login: (user: User, token: string) => void; // Login теперь принимает и пользователя, и токен
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false); // Начальное состояние - false
  const [isInitializing, setIsInitializing] = useState<boolean>(true); // НОВЫЙ флаг для первоначальной проверки

  // Функция для очистки состояния
  const clearAuthState = useCallback(() => {
    localStorage.removeItem('token');
    if (api.defaults.headers.common['Authorization']) {
        api.defaults.headers.common['Authorization'] = ''; // Очищаем заголовок в инстансе axios
    }
    setUser(null);
    setIsAuthenticated(false);
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
        } catch (error) {
          console.error('[AuthContext] verifyToken: Invalid token.', error);
          clearAuthState(); // Используем централизованную функцию очистки
        }
      }
      // Важно: isInitializing становится false в любом случае ПОСЛЕ попытки проверки
      setIsInitializing(false);
    };

    verifyToken();
  }, [clearAuthState]);

  // Улучшенная функция login
  const login = (loggedInUser: User, token: string) => {
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(loggedInUser);
    setIsAuthenticated(true);
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

  // Синхронизация между вкладками
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'token' && event.newValue === null) {
        // Если токен был удален в другой вкладке, выходим из системы и здесь
        clearAuthState();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [clearAuthState]);


  // Пока идет инициализация, показываем глобальный лоадер
  if (isInitializing) {
    return <LoadingAnimation />;
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout }}>
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