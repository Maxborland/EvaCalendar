
import { useNavigate } from 'react-router-dom';
import TopNavigator from '../components/TopNavigator';
import { useAuth } from '../context/useAuth';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-dvh flex flex-col bg-surface-app text-text-primary">
      <TopNavigator title="Профиль" showButtons={false} showBackButton={true} />

      <main className="flex-1 p-4 pb-[calc(24px+env(safe-area-inset-bottom))] max-[360px]:p-3">
        <section className="rounded-2xl border border-border-subtle bg-surface-raised p-4 shadow-glass">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-2xl border border-income-border bg-income-bg text-income-primary inline-flex items-center justify-center">
              <span className="material-icons text-[26px]" aria-hidden="true">person</span>
            </div>
            <div className="min-w-0">
              <h1 className="m-0 text-lg font-semibold leading-tight truncate">
                {user?.username || 'Пользователь'}
              </h1>
              <p className="m-0 mt-1 text-sm text-text-tertiary truncate">
                {user?.email || 'Аккаунт EvaCalendar'}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-2xl border border-border-subtle bg-surface-raised p-2 shadow-glass">
          <button
            type="button"
            className="w-full min-h-12 rounded-xl border border-transparent bg-transparent px-3 text-left text-text-primary inline-flex items-center justify-between gap-3 active:scale-[0.99]"
            onClick={() => navigate('/change-password')}
          >
            <span className="inline-flex min-w-0 items-center gap-2">
              <span className="material-icons text-[20px] text-text-tertiary" aria-hidden="true">lock_reset</span>
              <span className="truncate text-sm font-semibold">Сменить пароль</span>
            </span>
            <span className="material-icons text-[18px] text-text-tertiary" aria-hidden="true">chevron_right</span>
          </button>
          <button
            type="button"
            className="mt-1 w-full min-h-12 rounded-xl border border-expense-border bg-expense-bg px-3 text-left text-expense-primary inline-flex items-center justify-between gap-3 active:scale-[0.99]"
            onClick={logout}
          >
            <span className="inline-flex min-w-0 items-center gap-2">
              <span className="material-icons text-[20px]" aria-hidden="true">logout</span>
              <span className="truncate text-sm font-semibold">Выйти</span>
            </span>
          </button>
        </section>
      </main>
    </div>
  );
};

export default ProfilePage;
