import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingAnimation from './LoadingAnimation'; // Предполагаем, что такой компонент существует

interface PrivateRouteProps {
  children?: React.ReactNode;
  allowedRoles?: string[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingAnimation />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Проверка ролей (сохраняем эту логику из исходного файла)
  if (allowedRoles && allowedRoles.length > 0) {
    if (!user?.role || !allowedRoles.includes(user.role)) {
      // TODO: #TICKET-125 Рассмотреть создание специальной страницы /unauthorized
      return <Navigate to="/dashboard" replace />; // Или можно на /unauthorized
    }
  }

  return children ? <>{children}</> : <Outlet />;
};

export default PrivateRoute;