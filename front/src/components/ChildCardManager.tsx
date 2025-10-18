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

  return (
    <div className="child-card-manager">
      <h2>Карточки детей</h2>

      <button className="btn btn-primary add-button" onClick={handleOpenCreateModal}>
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

      <div className="child-list">
        {isLoading && <p>Загрузка...</p>}
        {!isLoading && children.length === 0 && <p>Пока нет добавленных карточек детей.</p>}
        {!isLoading && children.map(child => (
          <div key={child.uuid} className="card">
            <h3 className="card-heading">{child.childName}</h3>
            <div className="card-text-detail">
              <p><strong>Родитель:</strong> {child.parentName}</p>
              {child.parentPhone && <p><strong>Телефон:</strong> {child.parentPhone}</p>}
              {child.address && <p><strong>Адрес:</strong> {child.address}</p>}
              {child.hourlyRate && <p><strong>Ставка в час:</strong> {child.hourlyRate}</p>}
              {child.comment && <p><strong>Комментарий:</strong> {child.comment}</p>}
            </div>
            <div className="card-actions">
              <button className="btn btn-secondary" onClick={() => handleOpenEditModal(child)}>Редактировать</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChildCardManager;