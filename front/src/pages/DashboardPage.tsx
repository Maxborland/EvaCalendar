import React from 'react';
import { useAuth } from '../context/AuthContext';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Добро пожаловать на дашборд!</h1>
      {user && <p>Вы вошли как: {user.username || user.email}</p>}
      <p>Это защищенная страница.</p>
    </div>
  );
};

export default DashboardPage;