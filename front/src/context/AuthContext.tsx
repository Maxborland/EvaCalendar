import React, { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import api, { setAuthErrorHandler } from '../services/api'; // Предполагается, что api.ts экспортирует сконфигурированный экземпляр axios

// Типы
interface User {
  id: string;
  username: string;
  email: string;
  // Добавьте другие поля пользователя по необходимости
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
  }, []); // logout не зависит от внешних переменных, поэтому пустой массив зависимостей

  useEffect(() => {
    // Устанавливаем обработчик ошибок аутентификации при монтировании компонента
    // или при изменении функции logout
    setAuthErrorHandler(logout); // Передаем саму функцию logout

    const verifyToken = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setIsLoading(true);
        try {
          // Предполагается, что в api.ts будет функция fetchCurrentUser или аналогичная
          // которая использует токен для запроса /api/users/me
          const response = await api.get<User>('/api/users/me', {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          });
          setUser(response.data);
          setToken(storedToken);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Failed to verify token:', error);
          localStorage.removeItem('token');
          setUser(null);
          setToken(null);
          setIsAuthenticated(false);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false); // Нет токена, загрузка завершена
      }
    };

    verifyToken();
  }, [logout]); // Добавляем logout в зависимости useEffect

  const login = async (newToken: string) => {
    setIsLoading(true);
    try {
      localStorage.setItem('token', newToken);
      const response = await api.get<User>('/api/users/me', {
        headers: {
          Authorization: `Bearer ${newToken}`,
        },
      });
      setUser(response.data);
      setToken(newToken);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login failed:', error);
      localStorage.removeItem('token');
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      // Можно пробросить ошибку дальше, если нужно обработать в компоненте
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // const logout была перемещена выше и обернута в useCallback

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, login, logout }}>
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