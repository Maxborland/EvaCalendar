import React from 'react';
import { Navigate } from 'react-router-dom';
import UserManagement from '../components/UserManagement';
import { useAuth } from '../context/AuthContext';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  if (user && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="bg-slate-900 font-['Inter'] text-slate-100 min-h-screen p-5 text-center">
      <h1 className="text-2xl font-bold text-slate-100 mb-4">Добро пожаловать на дашборд!</h1>
      {user && <p className="text-slate-200 mb-2">Вы вошли как: {user.username || user.email}</p>}
      <p className="text-slate-400 mb-6">Это защищенная страница.</p>
      <UserManagement />
    </div>
  );
};

export default DashboardPage;