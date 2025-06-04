import React, { useCallback, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import type { Child } from '../services/api';
import ChildForm, { type ChildFormProps } from './ChildForm';
import './ChildFormModal.css';

export interface ChildFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (childData: Child | Omit<Child, 'uuid'>) => void;
  mode: 'create' | 'edit';
  initialChildData?: Child;
  onDelete?: (uuid: string) => void;
}

const ChildFormModal: React.FC<ChildFormModalProps> = ({
  isOpen,
  onClose: originalOnClose,
  onSubmit,
  mode,
  initialChildData,
  onDelete,
}) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      originalOnClose();
      setIsClosing(false);
    }, 300);
  }, [originalOnClose]);

  const [currentChildData, setCurrentChildData] = useState<Partial<Child> | undefined>(undefined);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialChildData) {
        setCurrentChildData(initialChildData);
      } else if (mode === 'create') {
        setCurrentChildData(initialChildData || {});
      }
    }
  }, [isOpen, mode, initialChildData]);


  const handleFormSave = (childDataFromForm: Child | Partial<Child>) => {
    // В ChildForm onSave возвращает полные данные или Partial<Child>
    // Нам нужно убедиться, что мы передаем правильный тип в onSubmit модального окна
    if (mode === 'create') {
      onSubmit(childDataFromForm as Omit<Child, 'uuid'>);
    } else if (mode === 'edit' && initialChildData?.uuid) {
      // Для редактирования, ChildForm может вернуть Partial<Child>, но нам нужен Child с uuid
      // Однако, ChildForm должен вернуть Child с uuid, если он был в initialChild
      onSubmit({ ...initialChildData, ...childDataFromForm } as Child);
    }
    // handleClose(); // Закрытие модального окна должно происходить в родительском компоненте после успешного onSubmit
  };

  const handleDeleteClick = () => {
    if (mode === 'edit' && initialChildData?.uuid && onDelete) {
      onDelete(initialChildData.uuid);
      // handleClose(); // Закрытие также в родительском компоненте
    }
  };

  if (!isOpen && !isClosing) {
    return null;
  }

  const modalOverlayClass = `modal-overlay ${isClosing ? 'closing' : ''}`;
  const modalContentClass = `modal-content ${isClosing ? 'closing' : ''}`;

  const title = mode === 'create' ? 'Добавить' : 'Редактировать';


    const childFormId = `child-form-${mode}-${initialChildData?.uuid || 'new'}`;
    const childFormProps: ChildFormProps = {
      initialChild: currentChildData,
      onSave: handleFormSave,
      onCancel: handleClose,
      isEmbeddedInModal: true,
      formId: childFormId,
    };
  const modalContent = (
    <div className={modalOverlayClass} onClick={handleClose} data-testid="modal-overlay">
      <div className={modalContentClass} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="btn btn-icon close-button" onClick={handleClose} aria-label="Закрыть">
          &times;
        </button>
        <h2>{title}</h2>

        <ChildForm {...childFormProps} />

        {/* Кнопки управления модальным окном, если они не дублируют кнопки ChildForm */}
        {/* Согласно UI/UX, кнопки "Отмена", "Добавить/Сохранить", "Удалить" должны быть здесь */}
        {/* ChildForm будет модифицирован, чтобы не показывать свои кнопки, когда isEmbeddedInModal=true */}
        <div className="child-form-modal-actions">
          {mode === 'edit' && onDelete && initialChildData?.uuid && (
            <button type="button" className="btn btn-danger" onClick={handleDeleteClick}>
              Удалить
            </button>
          )}
          {/* Заполнитель, чтобы кнопки "Отмена" и "Сохранить" были справа, если "Удалить" нет */}
          {!(mode === 'edit' && onDelete && initialChildData?.uuid) && <div style={{ flexGrow: 1 }}></div>}

          <button type="button" className="btn btn-secondary" onClick={handleClose}>
            Отмена
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              const formElement = document.getElementById(childFormId) as HTMLFormElement | null;
              if (formElement) {
                formElement.requestSubmit();
              }
            }}
          >
            {mode === 'edit' ? 'Сохранить' : 'Добавить'}
          </button>
        </div>
      </div>
    </div>
  );

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) {
    console.error("Элемент с id 'modal-root' не найден в DOM.");
    return null;
  }
  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default ChildFormModal;