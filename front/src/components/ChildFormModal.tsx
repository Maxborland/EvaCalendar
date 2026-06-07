import clsx from 'clsx';
import { useCallback, useEffect, useState } from 'react';
import * as ReactDOM from 'react-dom';
import type { Child } from '../services/api';
import ChildForm, { type ChildFormProps } from './ChildForm';

export interface ChildFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (childData: Child | Omit<Child, 'uuid'>) => void;
  mode: 'create' | 'edit';
  initialChildData?: Child;
  onDelete?: (uuid: string) => void;
}

const ChildFormModal = ({
  isOpen,
  onClose: originalOnClose,
  onSubmit,
  mode,
  initialChildData,
  onDelete,
}: ChildFormModalProps) => {
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
    if (mode === 'create') {
      onSubmit(childDataFromForm as Omit<Child, 'uuid'>);
    } else if (mode === 'edit' && initialChildData?.uuid) {
      onSubmit({ ...initialChildData, ...childDataFromForm } as Child);
    }
  };

  const handleDeleteClick = () => {
    if (mode === 'edit' && initialChildData?.uuid && onDelete) {
      onDelete(initialChildData.uuid);
    }
  };

  if (!isOpen && !isClosing) {
    return null;
  }

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
    <div
      className={clsx(
        'eva-modal-overlay',
        isClosing ? 'animate-fade-out' : 'animate-fade-in',
      )}
      onClick={handleClose}
      data-testid="modal-overlay"
    >
      <div
        className={clsx(
          'eva-modal-content w-[min(420px,100%)]',
          isClosing ? 'animate-scale-down' : 'animate-scale-up',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="eva-button eva-button--soft eva-icon-button absolute top-4 right-4 text-xl leading-none"
          onClick={handleClose}
          aria-label="Закрыть"
        >
          &times;
        </button>
        <div className="px-[22px] pt-6 pb-2 shrink-0">
          <h2 className="m-0 pr-12 text-[1.12rem] font-semibold text-text-primary">{title}</h2>
        </div>

        <div className="eva-modal-body px-[22px] pb-3">
          <ChildForm {...childFormProps} />
        </div>

        <div className="eva-modal-footer p-3.5 min-[520px]:justify-end">
          {mode === 'edit' && onDelete && initialChildData?.uuid && (
            <button
              type="button"
              className="eva-button eva-button--danger flex-1 min-[520px]:flex-none"
              onClick={handleDeleteClick}
            >
              <span className="material-icons">delete</span>
              <span>Удалить</span>
            </button>
          )}

          <button
            type="button"
            className="eva-button eva-button--secondary flex-1 min-[520px]:flex-none"
            onClick={handleClose}
          >
            <span className="material-icons">close</span>
            <span>Отмена</span>
          </button>
          <button
            type="button"
            className="eva-button eva-button--primary flex-1 min-[520px]:flex-none"
            onClick={() => {
              const formElement = document.getElementById(childFormId) as HTMLFormElement | null;
              if (formElement) {
                formElement.requestSubmit();
              }
            }}
          >
            <span className="material-icons">
              {mode === 'edit' ? 'save' : 'person_add'}
            </span>
            <span>{mode === 'edit' ? 'Сохранить' : 'Добавить'}</span>
          </button>
        </div>
      </div>
    </div>
  );

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) {
    return null;
  }
  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default ChildFormModal;
