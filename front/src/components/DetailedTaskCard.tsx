import { faEdit, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { type Task } from '../services/api';
import './DetailedTaskCard.css';

interface DetailedTaskCardProps {
  task: Task; // Предполагается, что тип Task будет расширен полями: parentName, parentPhoneNumber, childAddress, childHourlyRate
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  // onDuplicate: (taskId: string) => void; // Дублирование пока убрано
  // onToggleComplete больше не нужен, так как отметка о выполнении удаляется
}

const DetailedTaskCard: React.FC<DetailedTaskCardProps> = ({ task, onEdit, onDelete }) => {
  const {
    id,
    title,
    description,
    type, // тип используется для стилизации окантовки и условного отображения полей
    time,
    address, // Адрес задачи
    child_name,
    hourlyRate, // Ставка задачи
    amount,
    hoursWorked,
    comments,
    // completed, // Удаляем, так как отметка о выполнении убирается
    isPaid,
    expenseCategoryName,
    // Новые поля для информации о ребенке (должны быть добавлены в тип Task)
    parentName,
    parentPhone, // Изменено с parentPhoneNumber для соответствия api.ts
    childAddress, // Адрес ребенка (отличный от адреса задачи)
    childHourlyRate, // Ставка ребенка (информационная) - будет добавлено в api.ts
  } = task;

  const handleEdit = () => onEdit(task);
  const handleDelete = () => onDelete(id);

  // Класс `done` больше не используется, окантовка зависит только от `type`
  const cardClasses = `detailed-task-card ${type}`;

  return (
    <div className={cardClasses}>
      <div className="card-header">
        <h3>{title}</h3>
        <div className="task-actions">
          <button onClick={handleEdit} className="action-button icon-button" aria-label="Редактировать">
            <FontAwesomeIcon icon={faEdit} size="lg" />
          </button>
          <button onClick={handleDelete} className="action-button icon-button" aria-label="Удалить">
            <FontAwesomeIcon icon={faTrashAlt} size="lg" />
          </button>
        </div>
      </div>

      <div className="card-body">
        {description && <p><strong>Описание:</strong> {description}</p>}
        {time && <p><strong>Время:</strong> {time}</p>}
        {/* Поле "тип задачи" убрано из отображения */}
        {child_name && <p><strong>Ребенок:</strong> {child_name}</p>}
        {parentName && <p><strong>Имя родителя:</strong> {parentName}</p>}
        {parentPhone && <p><strong>Телефон родителя:</strong> {parentPhone}</p>}
        {childAddress && <p><strong>Адрес ребенка:</strong> {childAddress}</p>}
        {childHourlyRate !== undefined && <p><strong>Ставка ребенка (инфо):</strong> {childHourlyRate} ₽/час</p>}
        {address && <p><strong>Адрес задачи:</strong> {address}</p>}
        {hourlyRate !== undefined && type === 'hourly' && <p><strong>Ставка задачи:</strong> {hourlyRate} ₽/час</p>}
        {hoursWorked !== undefined && type === 'hourly' && <p><strong>Часы работы:</strong> {hoursWorked}</p>}
        {amount !== undefined && (type === 'fixed' || type === 'hourly' || type === 'income') && <p><strong>Заработано:</strong> {amount} ₽</p>}
        {expenseCategoryName && type === 'expense' && <p><strong>Категория:</strong> {expenseCategoryName}</p>}
        {amount !== undefined && type === 'expense' && <p><strong>Потрачено:</strong> {amount} ₽</p>}
        {comments && <p><strong>Комментарий к задаче:</strong> {comments}</p>}
      </div>

      {/* Футер с отметкой о выполнении и чекбоксом удален */}
      {/* Отображение информации об оплате остается, если это актуально и есть данные */}
      {(type === 'fixed' || type === 'hourly' || type === 'income') && isPaid !== undefined && (
        <div className="card-footer">
          <span>Оплата: {isPaid ? 'Оплачено' : 'Не оплачено'}</span>
        </div>
      )}
    </div>
  );
};

export default DetailedTaskCard;