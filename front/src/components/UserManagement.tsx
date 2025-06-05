import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext'; // Добавлен импорт useAuth
import type { NewUserCredentials, User } from '../services/api';
import { createUser, deleteUser, getUsers, updateUserPassword, updateUserRole } from '../services/api'; // Добавлены createUser, deleteUser
// import './UserManagement.css'; // Стили будут применены с помощью Tailwind CSS

interface UserManagementProps {}

const UserManagement: React.FC<UserManagementProps> = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUserPassword, setEditingUserPassword] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');

  // Состояния для добавления нового пользователя
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState<boolean>(false);
  const [newUserData, setNewUserData] = useState<NewUserCredentials>({
    username: '',
    email: '',
    password: '',
    role: 'user',
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof NewUserCredentials, string>>>({});


  const authContext = useAuth(); // Используем useAuth
  const currentUser = authContext.user; // Доступ к user напрямую, т.к. useAuth гарантирует контекст

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError('Не удалось загрузить пользователей.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchUsers();
    }
  }, [currentUser]);

  const handleRoleChange = async (userUuid: string, newRole: 'user' | 'admin') => {
    try {
      await updateUserRole(userUuid, newRole);
      toast.success('Роль пользователя успешно обновлена!');
      fetchUsers(); // Обновляем список пользователей
    } catch (err) {
      toast.error('Не удалось обновить роль пользователя.');
    }
  };

  const openPasswordModal = (user: User) => {
    setEditingUserPassword(user);
    setNewPassword('');
  };

  const closePasswordModal = () => {
    setEditingUserPassword(null);
    setNewPassword('');
  };

  const handlePasswordChange = async () => {
    if (!editingUserPassword || !newPassword) {
      toast.warn('Пожалуйста, введите новый пароль.');
      return;
    }
    try {
      await updateUserPassword(editingUserPassword.uuid, newPassword);
      toast.success(`Пароль для пользователя ${editingUserPassword.username} успешно изменен!`);
      closePasswordModal();
    } catch (err) {
      toast.error('Не удалось изменить пароль.');
    }
  };

  const handleOpenAddUserModal = () => {
    setNewUserData({ username: '', email: '', password: '', role: 'user' });
    setFormErrors({});
    setIsAddUserModalOpen(true);
  };

  const handleCloseAddUserModal = () => {
    setIsAddUserModalOpen(false);
  };

  const handleNewUserInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewUserData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof NewUserCredentials]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof NewUserCredentials, string>> = {};
    if (!newUserData.username.trim()) {
      errors.username = 'Имя пользователя обязательно для заполнения.';
    }
    if (!newUserData.email.trim()) {
      errors.email = 'Email обязателен для заполнения.';
    } else if (!/\S+@\S+\.\S+/.test(newUserData.email)) {
      errors.email = 'Некорректный формат email.';
    }
    if (!newUserData.password) {
      errors.password = 'Пароль обязателен для заполнения.';
    } else if (newUserData.password.length < 6) {
      errors.password = 'Пароль должен содержать не менее 6 символов.';
    }
    if (!newUserData.role) {
        errors.role = 'Роль обязательна для выбора.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateUser = async () => {
    if (!validateForm()) {
      return;
    }
    try {
      await createUser(newUserData);
      toast.success(`Пользователь ${newUserData.username} успешно создан!`);
      fetchUsers();
      handleCloseAddUserModal();
    } catch (err) {
    }
  };

  const handleDeleteUser = async (userUuid: string, username: string) => {
    if (window.confirm(`Вы уверены, что хотите удалить пользователя ${username}?`)) {
      try {
        await deleteUser(userUuid);
        toast.success(`Пользователь ${username} успешно удален!`);
        fetchUsers();
      } catch (err) {
      }
    }
  };

  if (currentUser?.role !== 'admin') {
    return null;
  }

  if (isLoading) {
    return <div className="text-slate-100">Загрузка пользователей...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4 bg-red-100 border border-red-400 rounded-md">{error}</div>;
  }

  return (
    <div className="bg-slate-800 rounded-2xl p-6 text-slate-100 w-full">
      <h2 className="text-2xl font-semibold mb-6 text-slate-100">Управление пользователями</h2>

      <div className="mb-6">
        <button
          onClick={handleOpenAddUserModal}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md text-sm"
        >
          Добавить пользователя
        </button>
      </div>

      {users.length === 0 ? (
        <p className="text-slate-400">Пользователи не найдены.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="w-full min-w-full divide-y divide-slate-700 border border-slate-700 border-collapse">
            <thead className="bg-slate-700/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider border border-slate-600">Имя пользователя</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider border border-slate-600">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider border border-slate-600">Роль</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider border border-slate-600">Действия</th>
              </tr>
            </thead>
            <tbody className="bg-slate-800 divide-y divide-slate-700">
              {users.map((user) => (
                <tr key={user.uuid} className="hover:bg-slate-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-200 border border-slate-700">{user.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-200 border border-slate-700">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-200 border border-slate-700">
                    {user.uuid === currentUser?.uuid ? (
                      user.role
                    ) : (
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.uuid, e.target.value as 'user' | 'admin')}
                        disabled={user.uuid === currentUser?.uuid}
                        className="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-1.5"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium border border-slate-700">
                    <button
                      onClick={() => openPasswordModal(user)}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-3 rounded-md text-sm mr-2"
                    >
                      Изменить пароль
                    </button>
                    {user.uuid !== currentUser?.uuid && (
                       <button
                           onClick={() => handleDeleteUser(user.uuid, user.username)}
                           className="bg-red-600 hover:bg-red-700 text-white font-semibold py-1 px-3 rounded-md text-sm"
                       >
                           Удалить
                       </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingUserPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-2xl shadow-xl w-full max-w-md mx-auto">
            <h3 className="text-xl font-semibold mb-4 text-slate-100">Изменить пароль для {editingUserPassword.username}</h3>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Новый пароль"
              className="w-full p-2.5 mb-4 bg-slate-700 border border-slate-600 text-slate-200 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={handlePasswordChange}
                className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md text-sm"
              >
                Сохранить
              </button>
              <button
                onClick={closePasswordModal}
                className="bg-slate-600 hover:bg-slate-500 text-slate-200 font-semibold py-2 px-4 rounded-md text-sm"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-2xl shadow-xl w-full max-w-lg mx-auto">
            <h3 className="text-xl font-semibold mb-6 text-slate-100">Добавить нового пользователя</h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-1">Имя пользователя</label>
                <input
                  type="text"
                  name="username"
                  id="username"
                  value={newUserData.username}
                  onChange={handleNewUserInputChange}
                  className={`w-full p-2.5 bg-slate-700 border ${formErrors.username ? 'border-red-500' : 'border-slate-600'} text-slate-200 rounded-md focus:ring-blue-500 focus:border-blue-500`}
                />
                {formErrors.username && <p className="text-red-500 text-xs mt-1">{formErrors.username}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={newUserData.email}
                  onChange={handleNewUserInputChange}
                  className={`w-full p-2.5 bg-slate-700 border ${formErrors.email ? 'border-red-500' : 'border-slate-600'} text-slate-200 rounded-md focus:ring-blue-500 focus:border-blue-500`}
                />
                {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">Пароль</label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  value={newUserData.password}
                  onChange={handleNewUserInputChange}
                  className={`w-full p-2.5 bg-slate-700 border ${formErrors.password ? 'border-red-500' : 'border-slate-600'} text-slate-200 rounded-md focus:ring-blue-500 focus:border-blue-500`}
                />
                {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>}
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-slate-300 mb-1">Роль</label>
                <select
                  name="role"
                  id="role"
                  value={newUserData.role}
                  onChange={handleNewUserInputChange}
                  className={`w-full p-2.5 bg-slate-700 border ${formErrors.role ? 'border-red-500' : 'border-slate-600'} text-slate-200 rounded-md focus:ring-blue-500 focus:border-blue-500`}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                {formErrors.role && <p className="text-red-500 text-xs mt-1">{formErrors.role}</p>}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={handleCreateUser}
                className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md text-sm"
              >
                Создать
              </button>
              <button
                onClick={handleCloseAddUserModal}
                className="bg-slate-600 hover:bg-slate-500 text-slate-200 font-semibold py-2 px-4 rounded-md text-sm"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;