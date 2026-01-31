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
        'fixed inset-0 p-[clamp(12px,4vh,28px)_clamp(12px,4vw,24px)] bg-modal-overlay flex items-end justify-center z-[1050] font-[Inter,sans-serif] min-[768px]:items-center',
        isClosing ? 'animate-fade-out' : 'animate-fade-in',
      )}
      onClick={handleClose}
      data-testid="modal-overlay"
    >
      <div
        className={clsx(
          'w-[min(420px,100%)] max-h-[calc(100dvh-clamp(24px,8vh,56px))] bg-modal-content rounded-[22px_22px_16px_16px] shadow-elevation-3 relative flex flex-col py-6 px-[22px] pb-[clamp(20px,4vh,28px)] overflow-hidden',
          'min-[768px]:rounded-3xl min-[768px]:max-h-[min(90vh,600px)]',
          isClosing ? 'animate-scale-down' : 'animate-scale-up',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="absolute top-4 right-4 size-11 rounded-xl border border-white/[0.06] bg-white/[0.04] text-text-secondary text-xl leading-none inline-flex items-center justify-center transition-all duration-[160ms] hover:rotate-[-90deg] hover:border-white/[0.12] hover:bg-white/[0.08]"
          onClick={handleClose}
          aria-label="Закрыть"
        >
          &times;
        </button>
        <h2 className="m-0 pr-12 text-[1.12rem] font-semibold text-text-primary">{title}</h2>

        <ChildForm {...childFormProps} />

        <div className="mt-auto flex flex-col gap-2.5 pt-3.5 border-t border-white/[0.08] bg-gradient-to-b from-transparent to-[rgba(17,21,32,0.6)] min-[520px]:flex-row min-[520px]:justify-end">
          {mode === 'edit' && onDelete && initialChildData?.uuid && (
            <button
              type="button"
              className="rounded-[14px] p-3.5 text-[0.94rem] font-semibold border-none inline-flex items-center justify-center gap-2 transition-[transform,box-shadow] duration-[160ms] bg-[rgba(224,86,86,0.18)] text-[#ffb3b8] border border-[rgba(224,86,86,0.28)] hover:-translate-y-px hover:bg-[rgba(224,86,86,0.22)] hover:border-[rgba(224,86,86,0.36)]"
              onClick={handleDeleteClick}
            >
              <span className="material-icons">delete</span>
              <span>Удалить</span>
            </button>
          )}

          <button
            type="button"
            className="rounded-[14px] p-3.5 text-[0.94rem] font-semibold border-none inline-flex items-center justify-center gap-2 transition-[transform,box-shadow] duration-[160ms] bg-white/[0.04] text-text-secondary border border-white/[0.08] hover:-translate-y-px hover:border-white/[0.16] hover:bg-white/[0.08]"
            onClick={handleClose}
          >
            <span className="material-icons">close</span>
            <span>Отмена</span>
          </button>
          <button
            type="button"
            className="rounded-[14px] p-3.5 text-[0.94rem] font-semibold border-none inline-flex items-center justify-center gap-2 transition-[transform,box-shadow] duration-[160ms] bg-gradient-to-br from-[rgba(47,143,82,1)] to-[rgba(73,187,120,0.92)] text-[var(--btn-primary-text-color)] shadow-elevation-2 hover:-translate-y-px hover:shadow-elevation-3"
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
