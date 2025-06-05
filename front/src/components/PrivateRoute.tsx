import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingAnimation from './LoadingAnimation'; // Предполагаем, что такой компонент существует

interface PrivateRouteProps {
  children?: React.ReactNode;
  allowedRoles?: string[]; // Добавляем опциональный пропс для разрешенных ролей
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth(); // Получаем также user для проверки роли

  if (isLoading) {
    return <LoadingAnimation />; // Показываем загрузку, пока проверяется аутентификация
  }

  if (!isAuthenticated) {
    // Если не аутентифицирован, перенаправляем на страницу входа
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    // Если указаны разрешенные роли, проверяем роль пользователя
    if (!user?.role || !allowedRoles.includes(user.role)) {
      // Если роль пользователя не определена или не входит в список разрешенных,
      // перенаправляем на страницу "Доступ запрещен" или на главную.
      // Здесь для примера перенаправляем на главную (или можно создать страницу /unauthorized)
      // TODO: Рассмотреть создание специальной страницы /unauthorized
      return <Navigate to="/dashboard" replace />; // Или <Navigate to="/unauthorized" replace />;
    }
  }

  // Если аутентифицирован и (роль не указана для проверки ИЛИ роль пользователя разрешена)
  return children ? <>{children}</> : <Outlet />;
};

export default PrivateRoute;