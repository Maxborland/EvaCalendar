import { createContext } from 'react';

export interface User {
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

export interface AuthContextType extends AuthState {
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateSubscriptionStatus: (isSubscribed: boolean) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
