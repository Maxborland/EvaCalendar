import { faEdit, faMapMarkerAlt, faPhone, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { type Task } from '../services/api';
import './DetailedTaskCard.css';

interface DetailedTaskCardProps {
  task: Task; // Тип Task должен включать: parentName, parentPhone, childAddress, childHourlyRate
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  // onDuplicate: (taskId: string) => void; // Дублирование пока убрано
  // onToggleComplete больше не нужен, так как отметка о выполнении удаляется
}

const DetailedTaskCard: React.FC<DetailedTaskCardProps> = ({ task, onEdit, onDelete }) => {
  const {
    uuid, // Используем uuid вместо id
    title,
    description,
    type, // тип используется для стилизации окантовки и условного отображения полей
    time,
    address, // Адрес задачи
    childName,
    hourlyRate, // Ставка задачи
    amount, // Используется для fixed (теперь только для fixed)
    amountEarned, // Используется для hourly и income
    amountSpent, // Используется для expense
    hoursWorked,
    comments,
    // completed, // Удаляем, так как отметка о выполнении убирается
    isPaid,
    expenseCategoryName,
    // Поля для информации о ребенке
    parentName,
    parentPhone,
    childAddress,
    childHourlyRate,
  } = task;

  const handleEdit = () => onEdit(task);
  const handleDelete = () => onDelete(uuid); // Используем uuid

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
        {childName && <p><strong>Ребенок:</strong> {childName}</p>}
        {address && <p><strong>Адрес задачи:</strong> {address}</p>}
        {hourlyRate !== undefined && type === 'hourly' && <p><strong>Ставка задачи:</strong> {hourlyRate} ₽/час</p>}
        {hoursWorked !== undefined && type === 'hourly' && <p><strong>Часы работы:</strong> {hoursWorked}</p>}
        {/* Отображение "Заработано" для 'fixed' */}
        {amount !== undefined && type === 'fixed' && (
          <p><strong>Заработано:</strong> {amount} ₽</p>
        )}
        {/* Отображение суммы для типа 'hourly' как "Доход" */}
        {amountEarned !== undefined && type === 'hourly' && (
          <p>
            <strong>Доход:</strong>
            <span className="amount-income"> {/* Используем класс для дохода */}
              {' '}+{amountEarned} ₽ {/* Используем amountEarned и префикс + */}
            </span>
          </p>
                )}
                {/* Отображение суммы для типа 'income' */}
                {amountEarned !== undefined && type === 'income' && (
                  <p>
                    <strong>Доход:</strong>
                    <span className="amount-income">
                      {' '}+{amountEarned} ₽
                    </span>
                  </p>
                )}
                {/* Отображение суммы для типа 'expense' */}
                {amountSpent !== undefined && type === 'expense' && (
                  <p>
                    <strong>Расход:</strong>
                    <span className="amount-expense">
                      {' '}-{amountSpent} ₽
                    </span>
                  </p>
                )}
        {expenseCategoryName && type === 'expense' && <p><strong>Категория:</strong> {expenseCategoryName}</p>}
        {comments && <p><strong>Комментарий к задаче:</strong> {comments}</p>}

        {(parentName || parentPhone || childAddress || childHourlyRate !== undefined) && (
          <div className="child-info-section">
            <h4>Информация о ребенке:</h4>
            {parentName && <p><strong>Имя родителя:</strong> {parentName}</p>}
            {parentPhone && (
              <p>
                <FontAwesomeIcon icon={faPhone} className="info-icon" />
                <strong>Телефон:</strong> {parentPhone}
              </p>
            )}
            {childAddress && (
              <p>
                <FontAwesomeIcon icon={faMapMarkerAlt} className="info-icon" />
                <strong>Адрес:</strong> {childAddress}
              </p>
            )}
            {childHourlyRate !== undefined && (
              <p>
                <strong>Ставка:</strong> {childHourlyRate} ₽/час
              </p>
            )}
          </div>
        )}
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