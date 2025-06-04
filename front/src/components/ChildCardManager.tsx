import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { addChild, type Child, deleteChild, getAllChildren, updateChild } from '../services/api';
import ChildFormModal from './ChildFormModal'; // Импортируем ChildFormModal
// ChildForm больше не используется здесь напрямую

const ChildCardManager: React.FC = () => {
  const [children, setChildren] = useState<Child[]>([]);
  // Состояния для модального окна
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentEditingChild, setCurrentEditingChild] = useState<Child | undefined>(undefined);

  const fetchChildren = useCallback(async () => {
    try {
      const data = await getAllChildren();
      setChildren(data);
    } catch (error) {
      toast.error('Ошибка при загрузке карточек детей.');
    }
  }, []);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

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
        await updateChild(currentEditingChild.uuid, childData as Child);
        toast.success('Карточка ребенка успешно обновлена!');
      } else {
        await addChild(childData as Omit<Child, 'uuid'>);
        toast.success('Новая карточка ребенка успешно добавлена!');
      }
      handleModalClose();
      fetchChildren(); // Обновляем список
    } catch (error) {
      toast.error('Ошибка при сохранении карточки ребенка.');
    }
  };

  const handleModalDelete = async (uuid: string) => {
    if (window.confirm('Вы уверены, что хотите удалить эту карточку ребенка?')) {
      try {
        await deleteChild(uuid);
        toast.success('Карточка ребенка успешно удалена!');
        handleModalClose();
        fetchChildren(); // Обновляем список
      } catch (error) {
        toast.error('Ошибка при удалении карточки ребенка.');
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
        {children.length === 0 && <p>Пока нет добавленных карточек детей.</p>}
        {children.map(child => (
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
              {/* Кнопка удаления теперь в модальном окне, но можно оставить и здесь для быстрого удаления без открытия модалки, если нужно */}
              {/* <button className="btn btn-secondary" onClick={() => handleModalDelete(child.uuid)}>Удалить</button> */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChildCardManager;