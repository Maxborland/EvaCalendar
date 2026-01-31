import clsx from 'clsx';
import { useState } from 'react';
import { useChildren, useAddChild, useUpdateChild, useDeleteChild } from '../hooks/useChildren';
import type { Child } from '../services/api';
import ChildFormModal from './ChildFormModal';

const ChildCardManager = () => {
  const { data: children = [], isLoading } = useChildren();
  const addChildMutation = useAddChild();
  const updateChildMutation = useUpdateChild();
  const deleteChildMutation = useDeleteChild();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentEditingChild, setCurrentEditingChild] = useState<Child | undefined>(undefined);

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setCurrentEditingChild(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (child: Child) => {
    setModalMode('edit');
    setCurrentEditingChild(child);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setCurrentEditingChild(undefined);
  };

  const handleModalSubmit = async (childData: Child | Omit<Child, 'uuid'>) => {
    try {
      if (modalMode === 'edit' && currentEditingChild?.uuid) {
        await updateChildMutation.mutateAsync({
          uuid: currentEditingChild.uuid,
          data: childData as Child
        });
      } else {
        await addChildMutation.mutateAsync(childData as Omit<Child, 'uuid'>);
      }
      handleModalClose();
    } catch (error) {
      // Ошибка обрабатывается в мутации
    }
  };

  const handleModalDelete = async (uuid: string) => {
    if (window.confirm('Вы уверены, что хотите удалить эту карточку ребенка?')) {
      try {
        await deleteChildMutation.mutateAsync(uuid);
        handleModalClose();
      } catch (error) {
        // Ошибка обрабатывается в мутации
      }
    }
  };

  if (isLoading) {
    return <p className="text-text-secondary text-center py-8 text-base">Загрузка...</p>;
  }

  return (
    <div className="flex flex-col w-full gap-6">
      <button
        className={clsx(
          'inline-flex items-center gap-2 py-2.5 px-5 min-h-11 self-start',
          'rounded-xl border-none text-sm font-semibold cursor-pointer',
          'bg-gradient-to-br from-btn-primary-bg to-[var(--theme-primary)] text-btn-primary-text shadow-glass',
          'transition-all duration-[180ms]',
          'hover:-translate-y-0.5 hover:shadow-elevation-2',
          'active:translate-y-0 active:shadow-glass',
        )}
        onClick={handleOpenCreateModal}
      >
        <span className="material-icons text-[20px]">add</span>
        Добавить карточку ребенка
      </button>

      <ChildFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        mode={modalMode}
        initialChildData={currentEditingChild}
        onDelete={modalMode === 'edit' ? handleModalDelete : undefined}
      />

      {children.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <span className="material-icons text-3xl text-text-tertiary">child_care</span>
          <p className="text-text-secondary text-sm">Пока нет добавленных карточек детей</p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-4 w-full">
          {children.map(child => (
            <div
              key={child.uuid}
              className={clsx(
                'bg-surface-raised border border-border-subtle rounded-2xl p-4 shadow-glass',
                'flex flex-col gap-3 transition-all duration-[180ms]',
                'hover:border-border-strong hover:shadow-elevation-2 hover:-translate-y-0.5',
              )}
            >
              <h3 className="m-0 text-text-primary text-xl font-semibold leading-tight pb-2 border-b border-border-subtle">
                {child.childName}
              </h3>
              <div className="flex flex-col gap-2">
                <p className="m-0 text-text-secondary text-sm leading-normal text-left">
                  <strong className="text-text-primary font-semibold">Родитель:</strong> {child.parentName}
                </p>
                {child.parentPhone && (
                  <p className="m-0 text-text-secondary text-sm leading-normal text-left">
                    <strong className="text-text-primary font-semibold">Телефон:</strong> {child.parentPhone}
                  </p>
                )}
                {child.address && (
                  <p className="m-0 text-text-secondary text-sm leading-normal text-left">
                    <strong className="text-text-primary font-semibold">Адрес:</strong> {child.address}
                  </p>
                )}
                {child.hourlyRate && (
                  <p className="m-0 text-text-secondary text-sm leading-normal text-left">
                    <strong className="text-text-primary font-semibold">Ставка в час:</strong> {child.hourlyRate}
                  </p>
                )}
                {child.comment && (
                  <p className="m-0 text-text-secondary text-sm leading-normal text-left">
                    <strong className="text-text-primary font-semibold">Комментарий:</strong> {child.comment}
                  </p>
                )}
              </div>
              <div className="mt-auto pt-3 border-t border-border-subtle flex justify-end gap-2">
                <button
                  className={clsx(
                    'inline-flex items-center gap-1 py-2 px-4 min-h-11',
                    'rounded-xl cursor-pointer text-sm font-semibold',
                    'border border-border-accent bg-income-bg text-income-primary',
                    'transition-all duration-[160ms]',
                    'hover:-translate-y-px hover:bg-btn-primary-bg hover:text-btn-primary-text hover:border-btn-primary-bg hover:shadow-glass',
                  )}
                  onClick={() => handleOpenEditModal(child)}
                >
                  Редактировать
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChildCardManager;
