import React, { useCallback, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import type { Child } from '../services/api';
import ChildForm, { type ChildFormProps } from './ChildForm'; // Импортируем ChildFormProps
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
    }, 300); // Длительность анимации закрытия
  }, [originalOnClose]);

  // Состояние для данных формы ChildForm.
  // ChildForm сам управляет своим состоянием, но нам нужно передать initialData
  // и получить данные при submit.
  // Этот стейт не используется для прямого управления полями, а для передачи initialChildData
  const [currentChildData, setCurrentChildData] = useState<Partial<Child> | undefined>(undefined);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialChildData) {
        setCurrentChildData(initialChildData);
      } else if (mode === 'create') {
        // Для создания можно передать пустой объект или объект с предзаполненными полями, если они есть
        setCurrentChildData(initialChildData || {}); // Позволяем передать initialChildData для 'create'
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

  const title = mode === 'create' ? 'Добавить ребенка' : 'Редактировать информацию о ребенке';

  // Пропсы для ChildForm
  const childFormId = `child-form-${mode}-${initialChildData?.uuid || 'new'}`;
  const childFormProps: ChildFormProps = {
    initialChild: currentChildData, // Передаем актуальные данные
    onSave: handleFormSave,
    onCancel: handleClose, // Кнопка "Отмена" в ChildForm закрывает модальное окно
    isEmbeddedInModal: true, // Новый проп для ChildForm
    formId: childFormId, // Передаем ID формы
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
              // Триггерим submit формы ChildForm программно, если это необходимо,
              // или ChildForm должен вызывать onSave при нажатии своей кнопки "Сохранить",
              // которая теперь будет единственной кнопкой сохранения.
              // Для этого ChildForm должен иметь доступ к своей кнопке submit или вызывать onSave.
              // Проще всего, если ChildForm сам обрабатывает свой submit и вызывает onSave.
              // А эти кнопки - это кнопки самого модального окна.
              // Чтобы это работало, ChildForm должен иметь ref на свою форму и метод для submit.
              // Или, что проще, ChildForm не будет иметь своих кнопок "Сохранить/Отмена",
              // а будет полагаться на кнопки модального окна.
              // В этом случае, нам нужен способ получить данные из ChildForm.
              // Самый простой способ - ChildForm вызывает onSave при изменении и валидации,
              // но это не стандартно.
              // Лучше, если ChildForm предоставляет ref для доступа к его данным или методу submit.

              // ВАРИАНТ: ChildForm не имеет своих кнопок "Сохранить", "Отмена", когда isEmbeddedInModal=true.
              // Модальное окно имеет свои кнопки. При нажатии "Сохранить" в модальном окне,
              // мы должны как-то получить данные из ChildForm и вызвать onSubmit.
              // Это можно сделать через ref на ChildForm, если ChildForm предоставляет метод для получения данных.

              // ТЕКУЩИЙ ПОДХОД: ChildForm будет иметь свои поля, но не кнопки "Сохранить"/"Отмена",
              // когда isEmbeddedInModal. Кнопки "Сохранить"/"Отмена" будут в модальном окне.
              // При нажатии "Сохранить" в модальном окне, мы должны вызвать onSave из ChildForm.
              // Это означает, что ChildForm должен иметь кнопку submit, которая вызывает его onSave.
              // И эта кнопка должна быть скрыта, а мы нажимаем ее программно.
              // Либо ChildFormProps.onSave вызывается из ChildForm при его внутреннем submit.
              // И мы просто вызываем submit формы ChildForm.

              // Для простоты, предположим, что ChildForm будет иметь скрытую кнопку submit,
              // или мы найдем способ вызвать его handleSubmit.
              // Пока что, ChildForm.onSave будет вызван из ChildForm.handleSubmit.
              // Эта кнопка "Сохранить" в модальном окне будет имитировать нажатие submit в ChildForm.
              // Это можно сделать, если ChildForm принимает ref на свою форму.

              // ИДЕЯ: ChildForm будет иметь проп `submitTrigger` (функция, которую ChildForm вызывает для получения триггера).
              // Модальное окно передает функцию, которая сохраняет триггер.
              // При нажатии "Сохранить" в модальном окне, вызывается этот триггер.
              // Это сложно.

              // ПРОЩЕ: ChildForm будет иметь ref. Модальное окно вызывает метод submit на этом ref.
              // ChildForm должен будет использовать useImperativeHandle.

              // САМЫЙ ПРОСТОЙ ВАРИАНT:
              // Кнопка "Сохранить" в модальном окне имеет form="id-формы-внутри-childform"
              // Это стандартный HTML атрибут. ChildForm должен установить id на свою <form>.
              // ChildFormProps будет включать formId: string.
              // const childFormId = `child-form-${mode}-${initialChildData?.uuid || 'new'}`; // ID уже определен выше
              const formElement = document.getElementById(childFormId) as HTMLFormElement | null;
              if (formElement) {
                // Программный вызов submit для формы. ChildForm.handleSubmit вызовет onSave.
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