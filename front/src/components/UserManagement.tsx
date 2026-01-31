import clsx from 'clsx';
import { useEffect, useState, type ChangeEvent } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import type { NewUserCredentials, User } from '../services/api';
import { createUser, deleteUser, getUsers, updateUserPassword, updateUserRole } from '../services/api';


const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUserPassword, setEditingUserPassword] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState<boolean>(false);
  const [newUserData, setNewUserData] = useState<NewUserCredentials>({
    username: '',
    email: '',
    password: '',
    role: 'user',
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof NewUserCredentials, string>>>({});


  const authContext = useAuth();
  const currentUser = authContext.user;

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
      fetchUsers();
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

  const handleNewUserInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      toast.error(`Не удалось создать пользователя ${newUserData.username}. Пожалуйста, попробуйте еще раз.`);
    }
  };

  const handleDeleteUser = async (userUuid: string, username: string) => {
    if (window.confirm(`Вы уверены, что хотите удалить пользователя ${username}?`)) {
      try {
        await deleteUser(userUuid);
        toast.success(`Пользователь ${username} успешно удален!`);
        fetchUsers();
      } catch (err) {
        toast.error(`Не удалось удалить пользователя ${username}. Пожалуйста, попробуйте еще раз.`);
      }
    }
  };

  if (currentUser?.role !== 'admin') {
    return null;
  }

  if (isLoading) {
    return <div className="text-text-primary">Загрузка пользователей...</div>;
  }

  if (error) {
    return <div className="text-expense-primary p-4 bg-expense-bg border border-expense-border rounded-md">{error}</div>;
  }

  const inputClasses = (hasError: boolean) =>
    clsx(
      'w-full p-2.5 bg-surface-elevated border text-text-primary rounded-md',
      'focus:ring-border-focus focus:border-border-focus',
      hasError ? 'border-expense-primary' : 'border-border-subtle'
    );

  return (
    <div className="bg-surface-raised rounded-2xl p-6 text-text-primary w-full">
      <h2 className="text-2xl font-semibold mb-6 text-text-primary">Управление пользователями</h2>

      <div className="mb-6">
        <button
          onClick={handleOpenAddUserModal}
          className="bg-btn-primary-bg hover:bg-btn-primary-hover text-btn-primary-text font-semibold min-h-11 py-2 px-4 rounded-md text-sm"
        >
          Добавить пользователя
        </button>
      </div>

      {users.length === 0 ? (
        <p className="text-text-tertiary">Пользователи не найдены.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-elevation-1">
          <table className="w-full min-w-full divide-y divide-border-subtle border border-border-subtle border-collapse">
            <thead className="bg-surface-elevated">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider border border-border-subtle">Имя пользователя</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider border border-border-subtle">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider border border-border-subtle">Роль</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider border border-border-subtle">Действия</th>
              </tr>
            </thead>
            <tbody className="bg-surface-raised divide-y divide-border-subtle">
              {users.map((user) => (
                <tr key={user.uuid} className="hover:bg-surface-elevated">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary border border-border-subtle">{user.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary border border-border-subtle">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary border border-border-subtle">
                    {user.uuid === currentUser?.uuid ? (
                      user.role
                    ) : (
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.uuid, e.target.value as 'user' | 'admin')}
                        disabled={user.uuid === currentUser?.uuid}
                        className="bg-surface-elevated border border-border-subtle text-text-secondary text-sm rounded-md focus:ring-border-focus focus:border-border-focus block w-full p-1.5 min-h-11"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium border border-border-subtle">
                    <button
                      onClick={() => openPasswordModal(user)}
                      className="bg-lesson-primary hover:opacity-90 text-text-invert font-semibold min-h-11 py-1 px-3 rounded-md text-sm mr-2"
                    >
                      Изменить пароль
                    </button>
                    {user.uuid !== currentUser?.uuid && (
                       <button
                           onClick={() => handleDeleteUser(user.uuid, user.username)}
                           className="bg-expense-primary hover:opacity-90 text-text-invert font-semibold min-h-11 py-1 px-3 rounded-md text-sm"
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
        <div className="fixed inset-0 bg-modal-overlay flex items-center justify-center z-50">
          <div className="bg-surface-raised p-6 rounded-2xl shadow-elevation-2 w-full max-w-md mx-auto">
            <h3 className="text-xl font-semibold mb-4 text-text-primary">Изменить пароль для {editingUserPassword.username}</h3>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Новый пароль"
              className="w-full p-2.5 mb-4 bg-surface-elevated border border-border-subtle text-text-primary rounded-md focus:ring-border-focus focus:border-border-focus"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={handlePasswordChange}
                className="bg-btn-primary-bg hover:bg-btn-primary-hover text-btn-primary-text font-semibold min-h-11 py-2 px-4 rounded-md text-sm"
              >
                Сохранить
              </button>
              <button
                onClick={closePasswordModal}
                className="bg-btn-secondary-bg hover:bg-btn-secondary-hover text-text-secondary font-semibold min-h-11 py-2 px-4 rounded-md text-sm"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-modal-overlay flex items-center justify-center z-50 p-4">
          <div className="bg-surface-raised p-6 rounded-2xl shadow-elevation-2 w-full max-w-lg mx-auto">
            <h3 className="text-xl font-semibold mb-6 text-text-primary">Добавить нового пользователя</h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-text-secondary mb-1">Имя пользователя</label>
                <input
                  type="text"
                  name="username"
                  id="username"
                  value={newUserData.username}
                  onChange={handleNewUserInputChange}
                  className={inputClasses(!!formErrors.username)}
                />
                {formErrors.username && <p className="text-expense-primary text-xs mt-1">{formErrors.username}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={newUserData.email}
                  onChange={handleNewUserInputChange}
                  className={inputClasses(!!formErrors.email)}
                />
                {formErrors.email && <p className="text-expense-primary text-xs mt-1">{formErrors.email}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1">Пароль</label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  value={newUserData.password}
                  onChange={handleNewUserInputChange}
                  className={inputClasses(!!formErrors.password)}
                />
                {formErrors.password && <p className="text-expense-primary text-xs mt-1">{formErrors.password}</p>}
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-text-secondary mb-1">Роль</label>
                <select
                  name="role"
                  id="role"
                  value={newUserData.role}
                  onChange={handleNewUserInputChange}
                  className={inputClasses(!!formErrors.role)}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                {formErrors.role && <p className="text-expense-primary text-xs mt-1">{formErrors.role}</p>}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={handleCreateUser}
                className="bg-btn-primary-bg hover:bg-btn-primary-hover text-btn-primary-text font-semibold min-h-11 py-2 px-4 rounded-md text-sm"
              >
                Создать
              </button>
              <button
                onClick={handleCloseAddUserModal}
                className="bg-btn-secondary-bg hover:bg-btn-secondary-hover text-text-secondary font-semibold min-h-11 py-2 px-4 rounded-md text-sm"
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
