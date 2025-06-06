import React, { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import api from '../services/api';

// Типы
interface User {
  uuid: string; // Изменено с id на uuid
  username: string;
  email: string;
  role: 'user' | 'admin'; // Уточнен тип роли
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>; // logout теперь async
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

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('[AuthContext] logout: API call failed', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const response = await api.get<User>('/users/me', {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          });
          setUser(response.data);
          setToken(storedToken);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('[AuthContext] verifyToken: Error verifying token.', error);
          localStorage.removeItem('token');
          setUser(null);
          setToken(null);
          setIsAuthenticated(false);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [logout]);

  const login = async (newToken: string) => {
    setIsLoading(true);
    try {
      localStorage.setItem('token', newToken);
      const response = await api.get<User>('/users/me', {
        headers: {
          Authorization: `Bearer ${newToken}`,
        },
      });
      setUser(response.data);
      setToken(newToken);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('[AuthContext] login: Failed.', error);
      localStorage.removeItem('token');
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      throw error; // Перебрасываем ошибку, чтобы компонент формы мог ее обработать
    } finally {
      setIsLoading(false);
    }
  };

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