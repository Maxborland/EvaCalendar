import clsx from 'clsx';
import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  useMyFamily,
  useCreateFamily,
  useUpdateFamily,
  useDeleteFamily,
  useRemoveFamilyMember,
  useLeaveFamily,
  useSendFamilyInvitation,
  useAcceptFamilyInvitation,
  usePendingInvitations,
  useCancelInvitation,
} from '../hooks/useFamily';

const inputClass =
  'w-full rounded-xl border border-border-subtle bg-surface-elevated text-text-primary py-2.5 px-3 text-sm transition-all duration-[180ms] placeholder:text-text-tertiary focus-visible:outline-none focus-visible:border-border-focus focus-visible:shadow-[0_0_0_3px_rgba(72,187,120,0.16)]';

const btnIconClass = clsx(
  'size-10 rounded-[10px] border border-border-subtle bg-white/[0.04]',
  'text-text-secondary inline-flex items-center justify-center cursor-pointer shrink-0',
  'transition-all duration-[160ms]',
  'hover:-translate-y-px hover:bg-white/[0.08] hover:border-border-strong',
  'active:translate-y-0',
);

const roleBadge = (role: string) => {
  const base = 'px-2 py-0.5 rounded-full text-xs font-medium';
  if (role === 'owner') return clsx(base, 'bg-income-bg text-income-primary border border-income-border');
  if (role === 'admin') return clsx(base, 'bg-task-bg text-task-primary border border-task-border');
  return clsx(base, 'bg-surface-glass text-text-secondary border border-border-subtle');
};

const roleLabel = (role: string) => {
  if (role === 'owner') return 'Владелец';
  if (role === 'admin') return 'Админ';
  return 'Участник';
};

const FamilyManager = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');

  const { data: family, isLoading } = useMyFamily();
  const createFamilyMutation = useCreateFamily();
  const updateFamilyMutation = useUpdateFamily();
  const deleteFamilyMutation = useDeleteFamily();
  const removeMemberMutation = useRemoveFamilyMember();
  const leaveFamilyMutation = useLeaveFamily();
  const sendInvitationMutation = useSendFamilyInvitation();
  const acceptInvitationMutation = useAcceptFamilyInvitation();
  const cancelInvitationMutation = useCancelInvitation();

  const isAdmin = family?.memberRole === 'owner' || family?.memberRole === 'admin';
  const { data: pendingInvitations = [] } = usePendingInvitations(
    isAdmin ? family?.uuid : undefined
  );

  const [newFamilyName, setNewFamilyName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');

  const handleCreateFamily = async (e: FormEvent) => {
    e.preventDefault();
    if (!newFamilyName.trim()) return;
    await createFamilyMutation.mutateAsync(newFamilyName.trim());
    setNewFamilyName('');
  };

  const handleUpdateName = async (e: FormEvent) => {
    e.preventDefault();
    if (!family || !editName.trim()) return;
    await updateFamilyMutation.mutateAsync({ uuid: family.uuid, name: editName.trim() });
    setEditingName(false);
  };

  const handleDelete = async () => {
    if (!family) return;
    if (!window.confirm('Удалить семью? Все приглашения будут отменены, связь задач с семьёй — снята.')) return;
    await deleteFamilyMutation.mutateAsync(family.uuid);
  };

  const handleRemoveMember = async (userUuid: string, username: string) => {
    if (!family) return;
    if (!window.confirm(`Удалить ${username} из семьи?`)) return;
    await removeMemberMutation.mutateAsync({ familyUuid: family.uuid, userUuid });
  };

  const handleLeave = async () => {
    if (!window.confirm('Вы уверены, что хотите покинуть семью?')) return;
    await leaveFamilyMutation.mutateAsync();
  };

  const handleSendInvitation = async (e: FormEvent) => {
    e.preventDefault();
    if (!family || !inviteEmail.trim()) return;
    await sendInvitationMutation.mutateAsync({ familyUuid: family.uuid, email: inviteEmail.trim() });
    setInviteEmail('');
  };

  const handleAcceptInvitation = async () => {
    if (!inviteToken) return;
    await acceptInvitationMutation.mutateAsync(inviteToken);
    setSearchParams({});
  };

  const handleCancelInvitation = async (invitationUuid: string) => {
    if (!window.confirm('Отменить приглашение?')) return;
    await cancelInvitationMutation.mutateAsync(invitationUuid);
  };

  if (isLoading) {
    return <p className="text-text-secondary text-center py-8 text-base">Загрузка...</p>;
  }

  // Показываем кнопку принятия приглашения при наличии токена
  if (inviteToken && !family) {
    return (
      <div className="flex flex-col w-full gap-6">
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <span className="material-icons text-4xl text-income-primary">mail</span>
          <p className="text-text-primary text-base">Вас пригласили в семью</p>
          <button
            onClick={handleAcceptInvitation}
            disabled={acceptInvitationMutation.isPending}
            className={clsx(
              'inline-flex items-center gap-2 py-2.5 px-5 min-h-11 rounded-xl border-none text-sm font-semibold cursor-pointer',
              'bg-gradient-to-br from-btn-primary-bg to-[var(--theme-primary)] text-btn-primary-text shadow-glass',
              'transition-all duration-[180ms]',
              'hover:-translate-y-0.5 hover:shadow-elevation-2',
              'active:translate-y-0',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            <span className="material-icons text-[20px]">check</span>
            {acceptInvitationMutation.isPending ? 'Принятие...' : 'Принять приглашение'}
          </button>
        </div>
      </div>
    );
  }

  // Состояние: нет семьи
  if (!family) {
    return (
      <div className="flex flex-col w-full gap-6">
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <span className="material-icons text-3xl text-text-tertiary">group</span>
          <p className="text-text-secondary text-sm">Вы пока не состоите в семье</p>
        </div>
        <form
          onSubmit={handleCreateFamily}
          className="flex gap-3 w-full max-[480px]:flex-col max-[480px]:gap-2"
        >
          <input
            className={clsx(inputClass, 'flex-1 !text-base !rounded-xl !py-3')}
            type="text"
            placeholder="Название семьи"
            value={newFamilyName}
            onChange={(e) => setNewFamilyName(e.target.value)}
          />
          <button
            type="submit"
            disabled={createFamilyMutation.isPending}
            className={clsx(
              'inline-flex items-center gap-2 py-2.5 px-5 min-h-11 rounded-xl border-none text-sm font-semibold cursor-pointer',
              'bg-gradient-to-br from-btn-primary-bg to-[var(--theme-primary)] text-btn-primary-text shadow-glass',
              'transition-all duration-[180ms]',
              'hover:-translate-y-0.5 hover:shadow-elevation-2',
              'active:translate-y-0',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'max-[480px]:w-full',
            )}
          >
            <span className="material-icons text-[20px]">add</span>
            Создать
          </button>
        </form>
      </div>
    );
  }

  // Есть семья
  return (
    <div className="flex flex-col w-full gap-6">
      {/* Заголовок семьи */}
      <div className="flex items-center gap-3">
        {editingName ? (
          <form onSubmit={handleUpdateName} className="flex gap-2 w-full items-center">
            <input
              type="text"
              className={clsx(inputClass, 'flex-1 !rounded-[10px]')}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              autoFocus
            />
            <button type="submit" className={btnIconClass} title="Сохранить">
              <span className="material-icons text-[20px]">save</span>
            </button>
            <button type="button" className={btnIconClass} onClick={() => setEditingName(false)} title="Отмена">
              <span className="material-icons text-[20px]">close</span>
            </button>
          </form>
        ) : (
          <>
            <h2 className="text-text-primary text-lg font-semibold flex-1">{family.name}</h2>
            {isAdmin && (
              <button
                className={btnIconClass}
                onClick={() => { setEditName(family.name); setEditingName(true); }}
                title="Переименовать"
              >
                <span className="material-icons text-[20px]">edit</span>
              </button>
            )}
          </>
        )}
      </div>

      {/* Список участников */}
      <div>
        <h3 className="text-text-secondary text-sm font-medium mb-3">Участники</h3>
        <ul className="w-full list-none p-0 m-0 flex flex-col gap-3">
          {family.members.map((member) => (
            <li
              key={member.uuid}
              className={clsx(
                'flex justify-between items-center py-3 px-4 max-[480px]:py-2 max-[480px]:px-3',
                'bg-surface-raised border border-border-subtle rounded-xl shadow-glass',
                'transition-all duration-[180ms]',
                'hover:border-border-strong hover:shadow-elevation-1 hover:-translate-y-px',
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="material-icons text-text-tertiary text-[20px]">person</span>
                <div className="min-w-0">
                  <span className="text-text-primary text-base font-medium block truncate max-[480px]:text-sm">
                    {member.username}
                  </span>
                  <span className="text-text-tertiary text-xs block truncate">{member.email}</span>
                </div>
                <span className={roleBadge(member.role)}>{roleLabel(member.role)}</span>
              </div>
              {isAdmin && member.role !== 'owner' && (
                <button
                  onClick={() => handleRemoveMember(member.user_uuid, member.username)}
                  disabled={removeMemberMutation.isPending}
                  className={clsx(
                    btnIconClass,
                    'hover:!bg-expense-bg hover:!border-expense-border hover:!text-expense-primary',
                  )}
                  title="Удалить из семьи"
                >
                  <span className="material-icons text-[20px]">person_remove</span>
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Приглашение — только для owner/admin */}
      {isAdmin && (
        <div>
          <h3 className="text-text-secondary text-sm font-medium mb-3">Пригласить участника</h3>
          <form
            onSubmit={handleSendInvitation}
            className="flex gap-3 w-full max-[480px]:flex-col max-[480px]:gap-2"
          >
            <input
              className={clsx(inputClass, 'flex-1 !text-base !rounded-xl !py-3')}
              type="email"
              placeholder="Email для приглашения"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <button
              type="submit"
              disabled={sendInvitationMutation.isPending}
              className={clsx(
                'inline-flex items-center gap-2 py-2.5 px-5 min-h-11 rounded-xl border-none text-sm font-semibold cursor-pointer',
                'bg-gradient-to-br from-btn-primary-bg to-[var(--theme-primary)] text-btn-primary-text shadow-glass',
                'transition-all duration-[180ms]',
                'hover:-translate-y-0.5 hover:shadow-elevation-2',
                'active:translate-y-0',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'max-[480px]:w-full',
              )}
            >
              <span className="material-icons text-[20px]">send</span>
              Пригласить
            </button>
          </form>

          {/* Ожидающие приглашения */}
          {pendingInvitations.length > 0 && (
            <div className="mt-4">
              <h4 className="text-text-tertiary text-xs font-medium mb-2">Ожидающие приглашения</h4>
              <ul className="w-full list-none p-0 m-0 flex flex-col gap-2">
                {pendingInvitations.map((inv) => (
                  <li
                    key={inv.uuid}
                    className={clsx(
                      'flex justify-between items-center py-2 px-3',
                      'bg-surface-glass border border-border-subtle/60 rounded-lg',
                    )}
                  >
                    <span className="text-text-secondary text-sm truncate">{inv.email}</span>
                    <button
                      onClick={() => handleCancelInvitation(inv.uuid)}
                      disabled={cancelInvitationMutation.isPending}
                      className={clsx(
                        btnIconClass,
                        '!size-8 !rounded-lg',
                        'hover:!bg-expense-bg hover:!border-expense-border hover:!text-expense-primary',
                      )}
                      title="Отменить приглашение"
                    >
                      <span className="material-icons text-[18px]">close</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Действия */}
      <div className="flex gap-3 pt-2 border-t border-border-subtle/60">
        {family.memberRole === 'owner' ? (
          <button
            onClick={handleDelete}
            disabled={deleteFamilyMutation.isPending}
            className={clsx(
              'inline-flex items-center gap-2 py-2.5 px-5 min-h-11 rounded-xl border border-expense-border text-sm font-semibold cursor-pointer',
              'bg-expense-bg text-expense-primary',
              'transition-all duration-[180ms]',
              'hover:-translate-y-0.5 hover:shadow-elevation-1',
              'active:translate-y-0',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            <span className="material-icons text-[20px]">delete</span>
            Удалить семью
          </button>
        ) : (
          <button
            onClick={handleLeave}
            disabled={leaveFamilyMutation.isPending}
            className={clsx(
              'inline-flex items-center gap-2 py-2.5 px-5 min-h-11 rounded-xl border border-border-subtle text-sm font-semibold cursor-pointer',
              'bg-surface-glass text-text-secondary',
              'transition-all duration-[180ms]',
              'hover:-translate-y-0.5 hover:shadow-elevation-1',
              'active:translate-y-0',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            <span className="material-icons text-[20px]">logout</span>
            Покинуть семью
          </button>
        )}
      </div>
    </div>
  );
};

export default FamilyManager;
