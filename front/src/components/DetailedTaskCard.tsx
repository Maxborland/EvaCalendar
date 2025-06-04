import React from 'react';
import { type Task } from '../services/api';

interface DetailedTaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const DetailedTaskCard: React.FC<DetailedTaskCardProps> = ({ task, onEdit, onDelete }) => {
  const {
    uuid,
    title,
    description,
    type, // тип используется для стилизации окантовки и условного отображения полей
    time,
    address,
    childName,
    hourlyRate,
    amount, // Используется для fixed (теперь только для fixed)
    amountEarned, // Используется для hourly и income
    amountSpent, // Используется для expense
    hoursWorked,
    comments,
    isPaid,
    expenseCategoryName,
    parentName,
    parentPhone,
    childAddress,
    childHourlyRate,
  } = task;

  const handleEdit = () => onEdit(task);
  const handleDelete = () => onDelete(uuid);

  // Класс `done` больше не используется, окантовка зависит только от `type`
  const cardClasses = `card ${type}`; // Используем новый класс .card и сохраняем класс типа для специфичных стилей

  return (
    <div className={cardClasses}>
      <div className="card-header"> {/* Этот div может быть удален, если card-heading и card-actions покроют все нужды */}
        <div className="card-heading"><h3>{title}</h3></div>
        <div className="task-actions card-actions">
          <button onClick={handleEdit} className="btn btn-icon action-button icon-button" aria-label="Редактировать">
            <span className="material-icons text-lg">edit</span>
          </button>
          <button onClick={handleDelete} className="btn btn-icon action-button icon-button" aria-label="Удалить">
            <span className="material-icons text-lg">delete</span>
          </button>
        </div>
      </div>

      <div className="card-body card-text-detail"> {/* Добавляем card-text-detail для стилизации текста */}
        {description && <p><strong>Описание:</strong> {description}</p>}
        {time && <p><strong>Время:</strong> {time}</p>}
        {childName && <p><strong>Ребенок:</strong> {childName}</p>}
        {address && <p><strong>Адрес задачи:</strong> {address}</p>}
        {hourlyRate !== undefined && type === 'hourly' && <p><strong>Ставка задачи:</strong> {hourlyRate} ₽/час</p>}
        {hoursWorked !== undefined && type === 'hourly' && <p><strong>Часы работы:</strong> {hoursWorked}</p>}
        {amount !== undefined && type === 'fixed' && (
          <p><strong>Заработано:</strong> {amount} ₽</p>
        )}
        {amountEarned !== undefined && type === 'hourly' && (
          <p>
            <strong>Доход:</strong>
            <span className="amount-income">
              {' '}+{amountEarned} ₽
            </span>
          </p>
                )}
                {amountEarned !== undefined && type === 'income' && (
                  <p>
                    <strong>Доход:</strong>
                    <span className="amount-income">
                      {' '}+{amountEarned} ₽
                    </span>
                  </p>
                )}
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
                <span className="material-icons info-icon">phone</span>
                <strong>Телефон:</strong> {parentPhone}
              </p>
            )}
            {childAddress && (
              <p>
                <span className="material-icons info-icon">location_on</span>
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

      {(type === 'fixed' || type === 'hourly' || type === 'income') && isPaid !== undefined && (
        <div className="card-footer">
          <span>Оплата: {isPaid ? 'Оплачено' : 'Не оплачено'}</span>
        </div>
      )}
    </div>
  );
};

export default DetailedTaskCard;